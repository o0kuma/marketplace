"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { api, uploadFile } from "@/lib/api";
import type { Product, OptionGroupInput, ProductVariantInput } from "@/types/product";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type OptionGroupState = { name: string; sortOrder: number; values: { name: string; sortOrder: number }[] };
type VariantRowState = { optionValueNames: string[]; price: string; stockQuantity: string; sku: string };

export default function EditProductPage() {
  const params = useParams();
  const id = Number(params.id);
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [productStatus, setProductStatus] = useState<"ON_SALE" | "SOLD_OUT">("ON_SALE");
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [useOptions, setUseOptions] = useState(false);
  const [optionGroups, setOptionGroups] = useState<OptionGroupState[]>([]);
  const [variants, setVariants] = useState<VariantRowState[]>([]);

  const fetchProduct = useCallback(async () => {
    if (Number.isNaN(id)) return;
    try {
      const p = await api<Product>(`/products/${id}`);
      setName(p.name);
      setDescription(p.description ?? "");
      setImageUrls(p.imageUrls?.length ? p.imageUrls : (p.imageUrl ? [p.imageUrl] : []));
      setPrice(String(p.price));
      setStockQuantity(String(p.stockQuantity));
      setCategoryId(p.categoryId != null ? String(p.categoryId) : "");
      setProductStatus(p.status === "SOLD_OUT" ? "SOLD_OUT" : "ON_SALE");

      const hasOpt = p.optionGroups && p.optionGroups.length > 0 && p.variants && p.variants.length > 0;
      setUseOptions(!!hasOpt);
      if (hasOpt && p.optionGroups && p.variants) {
        const groupsSorted = [...p.optionGroups].sort((a, b) => a.sortOrder - b.sortOrder);
        setOptionGroups(
          groupsSorted.map((g) => ({
            name: g.name,
            sortOrder: g.sortOrder,
            values: (g.values ?? []).sort((a, b) => a.sortOrder - b.sortOrder).map((v) => ({ name: v.name, sortOrder: v.sortOrder })),
          }))
        );
        const rowsFromApi = p.variants.map((v) => {
          const optionValueNames = groupsSorted.map((grp) => {
            const val = (grp.values ?? []).find((vv) => v.optionValueIds?.includes(vv.id));
            return val?.name ?? "";
          });
          return {
            optionValueNames,
            price: String(v.price),
            stockQuantity: String(v.stockQuantity),
            sku: v.sku ?? "",
          };
        });
        /** When API omitted optionValueIds (broken join table), pre-fill single-group SKUs by stable order. */
        const allNamesEmpty = rowsFromApi.every((row) => row.optionValueNames.every((n) => !String(n).trim()));
        const oneGroup = groupsSorted.length === 1;
        const valsSorted = [...(groupsSorted[0]?.values ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
        const varsSorted = [...p.variants].sort((a, b) => a.id - b.id);
        if (allNamesEmpty && oneGroup && valsSorted.length === varsSorted.length && valsSorted.length > 0) {
          setVariants(
            varsSorted.map((v, i) => ({
              optionValueNames: [valsSorted[i].name],
              price: String(v.price),
              stockQuantity: String(v.stockQuantity),
              sku: v.sku ?? "",
            }))
          );
        } else {
          setVariants(rowsFromApi);
        }
      } else {
        setOptionGroups([]);
        setVariants([]);
      }
    } catch {
      setError("상품을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    setError("");
    try {
      for (let i = 0; i < files.length; i++) {
        const { url } = await uploadFile(files[i]);
        setImageUrls((prev) => [...prev, url]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "이미지 업로드 실패");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeImage(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function moveImage(from: number, delta: number) {
    const to = from + delta;
    if (to < 0 || to >= imageUrls.length) return;
    setImageUrls((prev) => {
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  }

  function addOptionGroup() {
    setOptionGroups((prev) => [...prev, { name: "", sortOrder: prev.length, values: [{ name: "", sortOrder: 0 }] }]);
  }
  function removeOptionGroup(index: number) {
    setOptionGroups((prev) => prev.filter((_, i) => i !== index).map((g, i) => ({ ...g, sortOrder: i })));
    setVariants((prev) => prev.map((v) => ({ ...v, optionValueNames: v.optionValueNames.filter((_, i) => i !== index) })));
  }
  function updateOptionGroup(index: number, field: "name" | "sortOrder", value: string | number) {
    setOptionGroups((prev) => {
      const next = [...prev];
      if (field === "name") next[index] = { ...next[index], name: String(value) };
      else next[index] = { ...next[index], sortOrder: Number(value) };
      return next;
    });
  }
  function addOptionValue(groupIndex: number) {
    setOptionGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex ? { ...g, values: [...g.values, { name: "", sortOrder: g.values.length }] } : g
      )
    );
  }
  function removeOptionValue(groupIndex: number, valueIndex: number) {
    setOptionGroups((prev) => {
      const g = prev[groupIndex];
      if (g.values.length <= 1) return prev;
      return prev.map((gr, i) =>
        i === groupIndex
          ? { ...gr, values: gr.values.filter((_, j) => j !== valueIndex).map((v, j) => ({ ...v, sortOrder: j })) }
          : gr
      );
    });
  }
  function updateOptionValue(groupIndex: number, valueIndex: number, name: string) {
    setOptionGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex ? { ...g, values: g.values.map((v, j) => (j === valueIndex ? { ...v, name } : v)) } : g
      )
    );
  }
  function addVariantRow() {
    setVariants((prev) => [
      ...prev,
      { optionValueNames: optionGroups.map(() => ""), price: "", stockQuantity: "", sku: "" },
    ]);
  }
  function removeVariantRow(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }
  function updateVariantRow(index: number, field: keyof VariantRowState, value: string | string[]) {
    setVariants((prev) => {
      const next = [...prev];
      if (field === "optionValueNames") next[index] = { ...next[index], optionValueNames: value as string[] };
      else next[index] = { ...next[index], [field]: value };
      return next;
    });
  }
  function setVariantOptionValue(rowIndex: number, groupIndex: number, valueName: string) {
    setVariants((prev) => {
      const next = [...prev];
      const names = [...(next[rowIndex]?.optionValueNames ?? [])];
      while (names.length <= groupIndex) names.push("");
      names[groupIndex] = valueName;
      next[rowIndex] = { ...next[rowIndex], optionValueNames: names };
      return next;
    });
  }

  useEffect(() => {
    if (!user) router.push("/login");
    else if (user.role !== "SELLER") router.push("/");
    else {
      fetchProduct();
      api<{ id: number; name: string }[]>("/categories").then(setCategories).catch(() => setCategories([]));
    }
  }, [user, router, fetchProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== "SELLER") return;
    if (imageUrls.length === 0) {
      setError("이미지를 1장 이상 등록해 주세요.");
      return;
    }

    const hasOptions = useOptions && optionGroups.length > 0 && optionGroups.some((g) => g.values.some((v) => v.name.trim()));

    if (!hasOptions) {
      const priceNum = Number(price);
      const stockNum = Number(stockQuantity);
      if (priceNum < 0 || !Number.isInteger(priceNum)) {
        setError("가격은 0 이상의 정수여야 합니다.");
        return;
      }
      if (stockNum < 0 || !Number.isInteger(stockNum)) {
        setError("재고는 0 이상의 정수여야 합니다.");
        return;
      }
    } else {
      if (variants.length === 0) {
        setError("옵션 상품은 최소 1개 이상의 옵션 조합(행)을 입력해 주세요.");
        return;
      }
      const groupCount = optionGroups.length;
      for (const v of variants) {
        if (v.optionValueNames.length !== groupCount || v.optionValueNames.some((n) => !n?.trim())) {
          setError("각 옵션 조합에서 모든 옵션을 선택해 주세요.");
          return;
        }
        const p = Number(v.price);
        const s = Number(v.stockQuantity);
        if (p < 0 || !Number.isInteger(p) || s < 0 || !Number.isInteger(s)) {
          setError("옵션별 가격·재고는 0 이상의 정수여야 합니다.");
          return;
        }
      }
    }

    setError("");
    setSubmitting(true);
    try {
      if (!hasOptions) {
        await api(`/products/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: name.trim(),
            description: description?.trim() || null,
            imageUrls: imageUrls.length > 0 ? imageUrls : null,
            imageUrl: imageUrls[0] ?? null,
            price: Number(price),
            stockQuantity: Number(stockQuantity),
            categoryId: categoryId ? Number(categoryId) : null,
            status: productStatus,
          }),
        });
      } else {
        const optionGroupsPayload: OptionGroupInput[] = optionGroups
          .map((g, i) => ({
            name: g.name.trim(),
            sortOrder: i,
            values: g.values.filter((v) => v.name.trim()).map((v, j) => ({ name: v.name.trim(), sortOrder: j })),
          }))
          .filter((g) => g.values.length > 0);
        const variantsPayload: ProductVariantInput[] = variants.map((v) => ({
          price: Number(v.price),
          stockQuantity: Number(v.stockQuantity),
          sku: v.sku?.trim() || null,
          optionValueNames: v.optionValueNames.map((n) => n.trim()),
        }));
        await api(`/products/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: name.trim(),
            description: description?.trim() || null,
            imageUrls: imageUrls.length > 0 ? imageUrls : null,
            imageUrl: imageUrls[0] ?? null,
            price: Math.min(...variants.map((v) => Number(v.price))),
            stockQuantity: variants.reduce((sum, v) => sum + Number(v.stockQuantity), 0),
            categoryId: categoryId ? Number(categoryId) : null,
            status: productStatus,
            optionGroups: optionGroupsPayload,
            variants: variantsPayload,
          }),
        });
      }
      router.push("/seller/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정 실패");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== "SELLER") return null;
  if (loading) return <LoadingSpinner />;
  if (error && !name) return <p className="py-8 text-red-600">{error}</p>;

  const hasOptions = useOptions && optionGroups.length > 0;

  return (
    <div className="py-4">
      <Link href="/seller/products" className="text-sm text-[var(--market-text-muted)] hover:underline">
        ← 내 상품
      </Link>
      <h1 className="section-title mt-4">상품 수정</h1>
      <form onSubmit={handleSubmit} className="card mt-6 max-w-2xl space-y-5">
        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        <label className="block">
          <span className="label">카테고리</span>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-field w-full">
            <option value="">선택 안 함</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">상품명</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="input-field" />
        </label>
        <label className="block">
          <span className="label">이미지 (다중 선택 가능, 첫 번째가 대표 이미지)</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
            className="mt-1 w-full text-sm"
          />
          {imageUrls.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {imageUrls.map((url, index) => (
                <div key={`${url}-${index}`} className="relative group">
                  <img src={url} alt={`미리보기 ${index + 1}`} className="h-28 w-28 rounded-lg border object-cover" />
                  <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                    {index === 0 ? "대표" : index + 1}
                  </span>
                  <div className="absolute right-1 top-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    {index > 0 && (
                      <button type="button" onClick={() => moveImage(index, -1)} className="rounded bg-[var(--market-surface)] p-1 text-xs shadow" title="앞으로">
                        ←
                      </button>
                    )}
                    {index < imageUrls.length - 1 && (
                      <button type="button" onClick={() => moveImage(index, 1)} className="rounded bg-[var(--market-surface)] p-1 text-xs shadow" title="뒤로">
                        →
                      </button>
                    )}
                    <button type="button" onClick={() => removeImage(index)} className="rounded bg-red-500 p-1 text-xs text-white shadow" title="삭제">
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {uploading && <p className="mt-2 text-sm text-[var(--market-text-muted)]">업로드 중…</p>}
        </label>
        <label className="block">
          <span className="label">설명</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-field w-full" />
        </label>

        <div className="rounded-lg border border-[var(--market-border)] bg-[var(--market-accent-subtle)] p-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={useOptions}
              onChange={(e) => setUseOptions(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--market-border)] text-[var(--market-accent)]"
            />
            <span className="label">옵션 상품으로 등록 (용량·색상 등)</span>
          </label>
        </div>

        {!useOptions && (
          <>
            <label className="block">
              <span className="label">가격 (원)</span>
              <input type="number" min={0} step={1} value={price} onChange={(e) => setPrice(e.target.value)} required className="input-field w-full" />
            </label>
            <label className="block">
              <span className="label">재고 수량</span>
              <input type="number" min={0} step={1} value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} required className="input-field w-full" />
            </label>
          </>
        )}

        {useOptions && (
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="label">옵션 그룹 (예: 용량, 색상)</span>
                <button type="button" onClick={addOptionGroup} className="text-sm font-medium text-[var(--market-accent)] hover:underline">
                  + 그룹 추가
                </button>
              </div>
              {optionGroups.map((g, gi) => (
                <div key={gi} className="mb-4 rounded-lg border border-[var(--market-border)] bg-[var(--market-surface)] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      placeholder="그룹명"
                      value={g.name}
                      onChange={(e) => updateOptionGroup(gi, "name", e.target.value)}
                      className="input-field w-32"
                    />
                    <span className="text-sm text-[var(--market-text-muted)]">옵션값:</span>
                    {g.values.map((val, vi) => (
                      <span key={vi} className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="값"
                          value={val.name}
                          onChange={(e) => updateOptionValue(gi, vi, e.target.value)}
                          className="input-field w-24"
                        />
                        <button
                          type="button"
                          onClick={() => removeOptionValue(gi, vi)}
                          disabled={g.values.length <= 1}
                          className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700 disabled:opacity-40"
                        >
                          삭제
                        </button>
                      </span>
                    ))}
                    <button type="button" onClick={() => addOptionValue(gi)} className="text-sm text-[var(--market-accent)] hover:underline">
                      + 값 추가
                    </button>
                    <button type="button" onClick={() => removeOptionGroup(gi)} className="ml-auto text-sm text-red-600 hover:underline">
                      그룹 삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {hasOptions && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="label">옵션 조합 (가격·재고)</span>
                  <button type="button" onClick={addVariantRow} className="text-sm font-medium text-[var(--market-accent)] hover:underline">
                    + 행 추가
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px] border border-[var(--market-border)] text-sm">
                    <thead>
                      <tr className="bg-[var(--market-accent-subtle)]">
                        {optionGroups.map((g, i) => (
                          <th key={i} className="border-b border-[var(--market-border)] px-2 py-2 text-left font-medium">
                            {g.name || `옵션${i + 1}`}
                          </th>
                        ))}
                        <th className="border-b border-[var(--market-border)] px-2 py-2 text-left font-medium">가격(원)</th>
                        <th className="border-b border-[var(--market-border)] px-2 py-2 text-left font-medium">재고</th>
                        <th className="border-b border-[var(--market-border)] px-2 py-2 text-left font-medium">SKU</th>
                        <th className="w-16 border-b border-[var(--market-border)] px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((row, ri) => (
                        <tr key={ri} className="border-b border-[var(--market-border)]">
                          {optionGroups.map((g, gi) => (
                            <td key={gi} className="px-2 py-1.5">
                              <select
                                value={row.optionValueNames[gi] ?? ""}
                                onChange={(e) => setVariantOptionValue(ri, gi, e.target.value)}
                                className="w-full rounded border border-zinc-300 px-2 py-1 text-sm"
                              >
                                <option value="">선택</option>
                                {g.values
                                  .filter((v) => v.name.trim())
                                  .map((v) => (
                                    <option key={v.name} value={v.name}>
                                      {v.name}
                                    </option>
                                  ))}
                              </select>
                            </td>
                          ))}
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              min={0}
                              value={row.price}
                              onChange={(e) => updateVariantRow(ri, "price", e.target.value)}
                              className="w-24 rounded border border-zinc-300 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              min={0}
                              value={row.stockQuantity}
                              onChange={(e) => updateVariantRow(ri, "stockQuantity", e.target.value)}
                              className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={row.sku}
                              onChange={(e) => updateVariantRow(ri, "sku", e.target.value)}
                              placeholder="선택"
                              className="w-24 rounded border border-zinc-300 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <button type="button" onClick={() => removeVariantRow(ri)} className="text-xs text-red-600 hover:underline">
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <label className="block">
          <span className="label">판매 상태</span>
          <select
            value={productStatus}
            onChange={(e) => setProductStatus(e.target.value as "ON_SALE" | "SOLD_OUT")}
            className="input-field w-full"
          >
            <option value="ON_SALE">판매중</option>
            <option value="SOLD_OUT">품절</option>
          </select>
        </label>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "수정 중..." : "수정"}
        </button>
      </form>
    </div>
  );
}
