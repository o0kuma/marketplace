"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import WishlistButton from "@/app/components/WishlistButton";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Product, ProductVariantResponse } from "@/types/product";
import type { Review, ReviewableOrderItem } from "@/types/review";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/** Coerce API ids (number | string) so variant matching works after JSON parse. */
function toNumericOptionId(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { user } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewableItems, setReviewableItems] = useState<ReviewableOrderItem[]>([]);
  const [reviewForm, setReviewForm] = useState({ orderItemId: 0, rating: 5, content: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editContent, setEditContent] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);
  const [questions, setQuestions] = useState<{ id: number; authorName: string; content: string; createdAt: string }[]>([]);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  /** For option product: selected option value id per group (same order as product.optionGroups). */
  const [selectedOptionValueIds, setSelectedOptionValueIds] = useState<(number | null)[]>([]);

  const fetchProduct = useCallback(async () => {
    if (Number.isNaN(id)) return;
    setLoading(true);
    setError("");
    try {
      const p = await api<Product>(`/products/${id}`);
      setProduct(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    if (Number.isNaN(id)) return;
    try {
      const list = await api<Review[]>(`/products/${id}/reviews`);
      setReviews(list);
    } catch {
      setReviews([]);
    }
  }, [id]);

  const fetchReviewableItems = useCallback(async () => {
    if (Number.isNaN(id) || !user) return;
    try {
      const list = await api<ReviewableOrderItem[]>(`/products/${id}/reviews/reviewable-order-items`);
      setReviewableItems(list);
      if (list.length > 0 && !reviewForm.orderItemId) {
        setReviewForm((f) => ({ ...f, orderItemId: list[0].orderItemId }));
      }
    } catch {
      setReviewableItems([]);
    }
  }, [id, user]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [product?.id]);

  useEffect(() => {
    if (product?.optionGroups?.length) {
      setSelectedOptionValueIds(product.optionGroups.map(() => null));
    } else {
      setSelectedOptionValueIds([]);
    }
  }, [product?.id, product?.optionGroups?.length]);

  useEffect(() => {
    if (!product || typeof window === "undefined") return;
    const key = "recent-products";
    const raw = localStorage.getItem(key);
    const list: { id: number; name: string; imageUrl?: string | null }[] = raw ? JSON.parse(raw) : [];
    const next = [{ id: product.id, name: product.name, imageUrl: product.imageUrl }, ...list.filter((p) => p.id !== product.id)].slice(0, 10);
    localStorage.setItem(key, JSON.stringify(next));
  }, [product]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    fetchReviewableItems();
  }, [fetchReviewableItems]);

  const fetchQuestions = useCallback(async () => {
    if (Number.isNaN(id)) return;
    try {
      const list = await api<{ id: number; authorName: string; content: string; createdAt: string }[]>(`/products/${id}/questions`);
      setQuestions(list);
    } catch {
      setQuestions([]);
    }
  }, [id]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const fetchWishlistContains = useCallback(async () => {
    if (Number.isNaN(id) || !user) return;
    try {
      const contained = await api<boolean>("/wishlist/contains", { params: { productId: String(id) } });
      setInWishlist(contained);
    } catch {
      setInWishlist(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchWishlistContains();
  }, [fetchWishlistContains]);

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewForm.orderItemId || !product) return;
    setSubmittingReview(true);
    setError("");
    try {
      await api<Review>(`/products/${product.id}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          orderItemId: reviewForm.orderItemId,
          rating: reviewForm.rating,
          content: reviewForm.content || null,
        }),
      });
      setReviewForm((f) => ({ ...f, content: "" }));
      fetchReviews();
      fetchReviewableItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "리뷰 등록 실패");
    } finally {
      setSubmittingReview(false);
    }
  }

  async function handleUpdateReview(reviewId: number) {
    setError("");
    try {
      await api<Review>(`/reviews/${reviewId}`, {
        method: "PATCH",
        body: JSON.stringify({ rating: editRating, content: editContent }),
      });
      setEditingReviewId(null);
      fetchReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : "리뷰 수정 실패");
    }
  }

  async function handleDeleteReview(reviewId: number) {
    if (!confirm("리뷰를 삭제하시겠습니까?")) return;
    setError("");
    try {
      await api(`/reviews/${reviewId}`, { method: "DELETE" });
      setEditingReviewId(null);
      fetchReviews();
      fetchReviewableItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "리뷰 삭제 실패");
    }
  }

  const hasVariants = !!(product?.variants && product.variants.length > 0);
  const groupsSorted = product?.optionGroups?.slice().sort((a, b) => a.sortOrder - b.sortOrder) ?? [];
  let selectedVariant: ProductVariantResponse | null = null;
  if (
    hasVariants &&
    product?.variants &&
    selectedOptionValueIds.length === groupsSorted.length &&
    selectedOptionValueIds.every((id) => id != null)
  ) {
    const selectedNumeric = (selectedOptionValueIds as number[]).map((id) => toNumericOptionId(id)).filter((n): n is number => n != null);
    if (selectedNumeric.length === groupsSorted.length) {
      const found = product.variants.find((v) => {
        const ids = (v.optionValueIds ?? []).map((x) => toNumericOptionId(x)).filter((n): n is number => n != null);
        if (ids.length !== selectedNumeric.length) return false;
        return selectedNumeric.every((sid) => ids.includes(sid));
      });
      selectedVariant = found ?? null;
    }
  }

  const displayPrice = selectedVariant ? selectedVariant.price : product?.price ?? 0;
  const displayStock = selectedVariant ? selectedVariant.stockQuantity : product?.stockQuantity ?? 0;

  async function handleAddToCart() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!product || product.status !== "ON_SALE") return;
    const hasOpts = product.variants && product.variants.length > 0;
    if (hasOpts && !selectedVariant) return;
    setAddingToCart(true);
    setError("");
    try {
      await api(`/cart/items`, {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          quantity,
          ...(selectedVariant ? { productVariantId: selectedVariant.id } : {}),
        }),
      });
      if (typeof window !== "undefined") window.dispatchEvent(new Event("cart-updated"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "장바구니 담기 실패");
    } finally {
      setAddingToCart(false);
    }
  }

  function handleOrder() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!product || product.status !== "ON_SALE") return;
    const hasVariants = product.variants && product.variants.length > 0;
    if (hasVariants && !selectedVariant) return;
    const params = new URLSearchParams({ productId: String(product.id), quantity: String(quantity) });
    if (hasVariants && selectedVariant) params.set("productVariantId", String(selectedVariant.id));
    router.push(`/orders/checkout?${params.toString()}`);
  }

  if (loading) return <LoadingSpinner />;
  if (error && !product) return <p className="py-8 text-red-600">{error}</p>;
  if (!product) return null;

  const galleryUrls = product.imageUrls?.length ? product.imageUrls : (product.imageUrl ? [product.imageUrl] : []);
  const mainImageUrl = galleryUrls[selectedImageIndex] ?? product.imageUrl;

  return (
    <div>
      <Link href="/products" className="text-sm font-medium text-teal-800 hover:underline">
        ← Back to shop
      </Link>
      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="relative">
          <div className="sticky top-28 overflow-hidden rounded-3xl bg-stone-100 shadow-lg">
            <div className="relative aspect-square w-full sm:aspect-[4/5]">
              {mainImageUrl ? (
                <Image src={mainImageUrl} alt={product.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" unoptimized />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-stone-400">No image</div>
              )}
            </div>
            {galleryUrls.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                {galleryUrls.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedImageIndex(i)}
                    className={`h-2 rounded-full transition-all ${i === selectedImageIndex ? "w-6 bg-white" : "w-2 bg-white/60 hover:bg-white/80"}`}
                    aria-label={`이미지 ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
          {galleryUrls.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {galleryUrls.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImageIndex(i)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${i === selectedImageIndex ? "border-teal-600 ring-2 ring-teal-200" : "border-transparent hover:border-stone-300"}`}
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="64px" unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-4xl">{product.name}</h1>
            <WishlistButton productId={product.id} initialInWishlist={inWishlist} onToggled={setInWishlist} variant="normal" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-stone-900">₩{displayPrice.toLocaleString()}</p>
          <p className="mt-2 text-sm text-stone-500">Sold by <span className="font-medium text-stone-700">{product.sellerName}</span></p>
          {hasVariants && (
            <div className="mt-3 space-y-2">
              {groupsSorted.map((group, gi) => (
                <div key={group.id}>
                  <span className="text-sm font-medium text-stone-700">{group.name}</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {(group.values ?? []).map((val) => (
                      <button
                        key={val.id}
                        type="button"
                        onClick={() =>
                          setSelectedOptionValueIds((prev) => {
                            const next = [...prev];
                            const vid = toNumericOptionId(val.id);
                            const prevId = toNumericOptionId(prev[gi] ?? undefined);
                            next[gi] = prevId === vid ? null : val.id;
                            return next;
                          })
                        }
                        className={`rounded-full border px-3 py-1.5 text-sm transition ${
                          toNumericOptionId(selectedOptionValueIds[gi]) === toNumericOptionId(val.id)
                            ? "border-teal-600 bg-teal-50 text-teal-800"
                            : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                        }`}
                      >
                        {val.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {selectedVariant && (
                <p className="text-sm text-stone-600">
                  선택: <span className="font-medium">{selectedVariant.optionSummary ?? ""}</span>
                </p>
              )}
            </div>
          )}
          <p className="text-sm text-stone-500">{displayStock} in stock</p>
          {product.description && <p className="mt-6 leading-relaxed text-stone-600">{product.description}</p>}
          {product.status !== "ON_SALE" && (
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {product.status === "SOLD_OUT" ? "Currently out of stock" : "No longer available"}
            </p>
          )}
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          {product.status === "ON_SALE" && (
            <div className="market-sticky-summary mt-8 space-y-4 !p-6">
              {hasVariants && !selectedVariant && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">옵션을 선택해 주세요.</p>
              )}
              <label className="flex items-center gap-4">
                <span className="text-sm font-medium text-stone-700">Quantity</span>
                <input
                  type="number"
                  min={1}
                  max={displayStock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(Number(e.target.value) || 1, displayStock))}
                  className="input-field w-24 text-center"
                />
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={addingToCart || (hasVariants && !selectedVariant)}
                  className="btn-secondary flex-1"
                >
                  {addingToCart ? "Adding…" : "Add to cart"}
                </button>
                <button
                  type="button"
                  onClick={handleOrder}
                  disabled={hasVariants && !selectedVariant}
                  className="btn-primary flex-1"
                >
                  Buy now
                </button>
              </div>
            </div>
          )}
          {user?.role === "SELLER" && user?.id === product.sellerId && (
            <div className="mt-6 flex flex-wrap gap-3 border-t border-stone-200 pt-6">
              <Link href={`/seller/products/${product.id}/edit`} className="btn-secondary text-sm">
                Edit listing
              </Link>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm("Delete this product?")) return;
                  try {
                    await api(`/products/${product.id}`, { method: "DELETE" });
                    router.push("/products");
                    router.refresh();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Delete failed");
                  }
                }}
                className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delivery & return info */}
      <section className="card mt-8">
        <h2 className="section-title text-lg sm:text-xl">배송·교환·반품 안내</h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-600">
          <li>· 배송: 주문 결제 완료 후 1~3일 내 출고됩니다. (주말·공휴일 제외)</li>
          <li>· 교환/반품: 수령일로부터 7일 이내, 미개봉 시 가능합니다.</li>
          <li>· 자세한 내용은 <Link href="/terms" className="underline hover:text-zinc-900">이용약관</Link> 및 <Link href="/privacy" className="underline hover:text-zinc-900">개인정보처리방침</Link>을 참고해 주세요.</li>
        </ul>
      </section>

      {/* Reviews */}
      <section className="card mt-8">
        <h2 className="section-title text-lg sm:text-xl">리뷰 ({reviews.length})</h2>
        {user && reviewableItems.length > 0 && (
          <form onSubmit={handleSubmitReview} className="mt-4 rounded bg-zinc-50 p-4">
            <p className="mb-2 text-sm text-zinc-600">리뷰 작성 (구매 확정된 주문)</p>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <span className="text-sm w-24">주문</span>
                <select
                  value={reviewForm.orderItemId}
                  onChange={(e) =>
                    setReviewForm((f) => ({ ...f, orderItemId: Number(e.target.value) }))
                  }
                  className="rounded border border-zinc-300 px-2 py-1 text-sm"
                >
                  {reviewableItems.map((item) => (
                    <option key={item.orderItemId} value={item.orderItemId}>
                      주문 #{item.orderId} · {item.productName} x{item.quantity}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2">
                <span className="text-sm w-24">평점</span>
                <select
                  value={reviewForm.rating}
                  onChange={(e) =>
                    setReviewForm((f) => ({ ...f, rating: Number(e.target.value) }))
                  }
                  className="rounded border border-zinc-300 px-2 py-1"
                >
                  {[1, 2, 3, 4, 5].map((r) => (
                    <option key={r} value={r}>
                      {r}점
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm">내용</span>
                <textarea
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm((f) => ({ ...f, content: e.target.value }))}
                  rows={3}
                  className="rounded border border-zinc-300 px-2 py-1 text-sm"
                  placeholder="리뷰 내용 (선택)"
                />
              </label>
              <button
                type="submit"
                disabled={submittingReview}
                className="w-fit rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {submittingReview ? "등록 중..." : "리뷰 등록"}
              </button>
            </div>
          </form>
        )}
        <ul className="mt-4 space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded border border-zinc-100 p-3">
              {editingReviewId === review.id ? (
                <div className="flex flex-col gap-2">
                  <select
                    value={editRating}
                    onChange={(e) => setEditRating(Number(e.target.value))}
                    className="w-fit rounded border px-2 py-1 text-sm"
                  >
                    {[1, 2, 3, 4, 5].map((r) => (
                      <option key={r} value={r}>{r}점</option>
                    ))}
                  </select>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={2}
                    className="rounded border px-2 py-1 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateReview(review.id)}
                      className="rounded bg-zinc-800 px-3 py-1 text-sm text-white"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReviewId(null);
                        setEditRating(review.rating);
                        setEditContent(review.content || "");
                      }}
                      className="rounded border px-3 py-1 text-sm"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{review.authorName}</span>
                    <span className="text-sm text-zinc-500">
                      ★ {review.rating} · {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-700">{review.content || "(내용 없음)"}</p>
                  {user?.id === review.authorId && (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingReviewId(review.id);
                          setEditRating(review.rating);
                          setEditContent(review.content || "");
                        }}
                        className="text-sm text-zinc-600 underline"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(review.id)}
                        className="text-sm text-red-600 underline"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
        {reviews.length === 0 && (
          <p className="mt-4 text-sm text-zinc-500">아직 리뷰가 없습니다.</p>
        )}
      </section>

      {/* Q&A */}
      <section className="card mt-8">
        <h2 className="section-title text-lg sm:text-xl">상품 문의 ({questions.length})</h2>
        {user && product && (
          <form
            className="mt-4 flex flex-col gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const content = (form.querySelector('textarea[name="question"]') as HTMLTextAreaElement)?.value?.trim();
              if (!content) return;
              setSubmittingQuestion(true);
              try {
                await api(`/products/${product.id}/questions`, {
                  method: "POST",
                  body: JSON.stringify({ content }),
                });
                (form.querySelector('textarea[name="question"]') as HTMLTextAreaElement).value = "";
                fetchQuestions();
              } catch {
                setError("문의 등록에 실패했습니다.");
              } finally {
                setSubmittingQuestion(false);
              }
            }}
          >
            <textarea name="question" rows={2} placeholder="문의 내용" className="rounded border border-zinc-300 px-2 py-1 text-sm" />
            <button type="submit" disabled={submittingQuestion} className="w-fit rounded bg-zinc-800 px-3 py-1 text-sm text-white disabled:opacity-50">
              {submittingQuestion ? "등록 중..." : "문의 등록"}
            </button>
          </form>
        )}
        <ul className="mt-4 space-y-3">
          {questions.map((q) => (
            <li key={q.id} className="rounded border border-zinc-100 bg-zinc-50/50 p-3">
              <p className="text-sm font-medium text-zinc-700">{q.authorName}</p>
              <p className="mt-1 text-sm text-zinc-600">{q.content}</p>
              <p className="mt-1 text-xs text-zinc-400">{new Date(q.createdAt).toLocaleDateString("ko-KR")}</p>
            </li>
          ))}
        </ul>
        {questions.length === 0 && <p className="mt-4 text-sm text-zinc-500">아직 문의가 없습니다.</p>}
      </section>
    </div>
  );
}
