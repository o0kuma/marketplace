"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Member } from "@/types/auth";
import type { PageResponse } from "@/types/common";
import type { MyQuestionItem, MyReviewItem } from "@/types/mypage";
import type { WishlistItem } from "@/types/wishlist";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function MypagePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [passwordSection, setPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [withdrawConfirm, setWithdrawConfirm] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const [recentProducts, setRecentProducts] = useState<{ id: number; name: string; imageUrl?: string | null }[]>([]);
  const [wishlist, setWishlist] = useState<PageResponse<WishlistItem> | null>(null);
  const [myReviews, setMyReviews] = useState<PageResponse<MyReviewItem> | null>(null);
  const [myQuestions, setMyQuestions] = useState<PageResponse<MyQuestionItem> | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editReviewRating, setEditReviewRating] = useState(5);
  const [editReviewContent, setEditReviewContent] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);

  const fetchMe = useCallback(async () => {
    try {
      const me = await api<Member>("/members/me");
      setMember(me);
      setName(me.name ?? "");
      setPhone(me.phone ?? "");
      setAddress(me.address ?? "");
    } catch {
      setError("회원 정보를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchMe();
  }, [user, router, fetchMe]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("recent-products");
      const list = raw ? JSON.parse(raw) : [];
      setRecentProducts(Array.isArray(list) ? list.slice(0, 10) : []);
    } catch {
      setRecentProducts([]);
    }
  }, []);

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await api<PageResponse<WishlistItem>>("/wishlist", { params: { page: "0", size: "20" } });
      setWishlist(res);
    } catch {
      setWishlist(null);
    }
  }, []);

  const fetchMyReviews = useCallback(async () => {
    try {
      const res = await api<PageResponse<MyReviewItem>>("/members/me/reviews", { params: { page: "0", size: "10" } });
      setMyReviews(res);
    } catch {
      setMyReviews(null);
    }
  }, []);

  const fetchMyQuestions = useCallback(async () => {
    try {
      const res = await api<PageResponse<MyQuestionItem>>("/members/me/questions", { params: { page: "0", size: "10" } });
      setMyQuestions(res);
    } catch {
      setMyQuestions(null);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchWishlist();
    fetchMyReviews();
    fetchMyQuestions();
  }, [user, fetchWishlist, fetchMyReviews, fetchMyQuestions]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const updated = await api<Member>("/members/me", {
        method: "PATCH",
        body: JSON.stringify({ name, phone, address }),
      });
      setMember(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정 실패");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPasswordSuccess("");
    setSubmitting(true);
    try {
      await api("/members/me/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword: currentPassword, newPassword: newPassword }),
      });
      setPasswordSuccess("비밀번호가 변경되었습니다.");
      setCurrentPassword("");
      setNewPassword("");
      setPasswordSection(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호 변경 실패");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleProfilePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setError("");
    setProfileUploading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${window.location.origin}/api/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "업로드 실패");
      }
      const data = (await res.json()) as { url: string };
      await api<Member>("/members/me", {
        method: "PATCH",
        body: JSON.stringify({ profileImageUrl: data.url }),
      });
      await fetchMe();
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "프로필 이미지 저장 실패");
    } finally {
      setProfileUploading(false);
    }
  }

  function startEditReview(r: MyReviewItem) {
    setEditingReviewId(r.id);
    setEditReviewRating(r.rating);
    setEditReviewContent(r.content ?? "");
    setError("");
  }

  function cancelEditReview() {
    setEditingReviewId(null);
  }

  async function saveEditReview(reviewId: number) {
    setReviewSaving(true);
    setError("");
    try {
      await api(`/reviews/${reviewId}`, {
        method: "PATCH",
        body: JSON.stringify({
          rating: editReviewRating,
          content: editReviewContent.trim() || null,
        }),
      });
      setEditingReviewId(null);
      await fetchMyReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : "리뷰 수정에 실패했습니다.");
    } finally {
      setReviewSaving(false);
    }
  }

  async function deleteReview(reviewId: number) {
    if (!confirm("이 리뷰를 삭제하시겠습니까?")) return;
    setError("");
    try {
      await api(`/reviews/${reviewId}`, { method: "DELETE" });
      if (editingReviewId === reviewId) setEditingReviewId(null);
      await fetchMyReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : "리뷰 삭제에 실패했습니다.");
    }
  }

  async function handleWithdraw() {
    if (withdrawConfirm !== "탈퇴합니다") return;
    setWithdrawing(true);
    setError("");
    try {
      await api("/members/me", { method: "DELETE" });
      router.push("/");
      router.refresh();
      if (typeof window !== "undefined") window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "탈퇴 처리 실패");
    } finally {
      setWithdrawing(false);
    }
  }

  if (!user) return null;
  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h1 className="section-title">마이페이지</h1>
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-[var(--market-text)]">사용자 정보</h2>
        <div className="mb-6 flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-[var(--market-border)] bg-[var(--market-accent-subtle)]">
            {member?.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.profileImageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-[var(--market-accent)]">
                {(name || user.name || "?").slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <label className="btn-secondary inline-flex cursor-pointer">
              {profileUploading ? "업로드 중…" : "프로필 사진 변경"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                disabled={profileUploading}
                onChange={handleProfilePhotoChange}
              />
            </label>
            <p className="mt-1 text-xs text-[var(--market-text-muted)]">JPG, PNG, GIF, WebP · 헤더 메뉴에 반영됩니다.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <label className="block"><span className="label">이름</span><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" /></label>
          <label className="block"><span className="label">이메일</span><input type="email" value={member?.email ?? ""} disabled className="input-field bg-[var(--market-accent-subtle)]" /></label>
          <label className="block"><span className="label">전화번호</span><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" placeholder="010-0000-0000" /></label>
          <label className="block"><span className="label">주소</span><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="input-field" placeholder="주소 입력" /></label>
          <button type="submit" disabled={submitting} className="btn-primary mt-1 w-fit">{submitting ? "저장 중..." : "저장"}</button>
        </form>
      </div>
      {passwordSuccess && <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-800">{passwordSuccess}</p>}
      <div className="card">
        <h2 className="mb-3 text-lg font-semibold text-[var(--market-text)]">내 활동</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/orders" className="text-[var(--market-text)] underline hover:text-[var(--market-accent)]">주문 내역</Link>
            <span className="ml-1 text-[var(--market-text-muted)]">· 구매 확정된 상품에 리뷰를 작성할 수 있습니다.</span>
          </li>
          <li>
            <Link href="/products" className="text-[var(--market-text)] underline hover:text-[var(--market-accent)]">상품 목록</Link>
            <span className="ml-1 text-[var(--market-text-muted)]">· 상품 상세에서 문의를 남기실 수 있습니다.</span>
          </li>
        </ul>
      </div>

      {/* Wishlist */}
      <div className="card">
        <h2 className="mb-3 text-lg font-semibold text-[var(--market-text)]">찜 목록</h2>
        {wishlist && wishlist.content.length > 0 ? (
          <ul className="space-y-3">
            {wishlist.content.map((item) => (
              <li key={item.wishlistId} className="flex items-center gap-3 rounded-lg border border-[var(--market-border)] p-3">
                <Link href={`/products/${item.productId}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded bg-[var(--market-accent-subtle)]">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="56px" unoptimized />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs text-[var(--market-text-muted)]">이미지 없음</span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-[var(--market-text)]">{item.productName}</span>
                    <span className="text-sm text-[var(--market-text-muted)]">{item.price.toLocaleString()}원</span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api(`/wishlist/products/${item.productId}`, { method: "DELETE" });
                      fetchWishlist();
                    } catch {
                      setError("찜 해제에 실패했습니다.");
                    }
                  }}
                  className="shrink-0 rounded border border-[var(--market-border)] px-3 py-1.5 text-sm text-[var(--market-text-muted)] hover:bg-[var(--market-accent-subtle)]"
                >
                  찜 해제
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--market-text-muted)]">찜한 상품이 없습니다. 상품 목록에서 하트를 눌러 찜해 보세요.</p>
        )}
      </div>

      {/* My reviews */}
      <div className="card">
        <h2 className="mb-3 text-lg font-semibold text-zinc-900">내가 쓴 리뷰</h2>
        {myReviews && myReviews.content.length > 0 ? (
          <ul className="space-y-3">
            {myReviews.content.map((r) => (
              <li key={r.id} className="rounded-lg border border-zinc-100 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Link href={`/products/${r.productId}`} className="font-medium text-zinc-900 hover:underline">
                    {r.productName}
                  </Link>
                  {editingReviewId !== r.id && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => startEditReview(r)}
                        className="text-sm font-medium text-teal-800 hover:underline"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteReview(r.id)}
                        className="text-sm font-medium text-zinc-500 hover:text-red-600"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
                {editingReviewId === r.id ? (
                  <div className="mt-3 space-y-3">
                    <label className="block">
                      <span className="label">별점</span>
                      <select
                        value={editReviewRating}
                        onChange={(e) => setEditReviewRating(Number(e.target.value))}
                        className="input-field w-auto min-w-[100px]"
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n}점
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="label">내용</span>
                      <textarea
                        value={editReviewContent}
                        onChange={(e) => setEditReviewContent(e.target.value)}
                        rows={3}
                        className="input-field resize-y"
                        placeholder="리뷰 내용 (선택)"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={reviewSaving}
                        onClick={() => void saveEditReview(r.id)}
                        className="btn-primary disabled:opacity-50"
                      >
                        {reviewSaving ? "저장 중…" : "저장"}
                      </button>
                      <button type="button" onClick={cancelEditReview} className="btn-secondary">
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-zinc-600">★ {r.rating} · {r.content || "(내용 없음)"}</p>
                    <p className="mt-1 text-xs text-zinc-400">{new Date(r.createdAt).toLocaleDateString("ko-KR")}</p>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">작성한 리뷰가 없습니다.</p>
        )}
      </div>

      {/* My questions */}
      <div className="card">
        <h2 className="mb-3 text-lg font-semibold text-zinc-900">내가 남긴 문의</h2>
        {myQuestions && myQuestions.content.length > 0 ? (
          <ul className="space-y-3">
            {myQuestions.content.map((q) => (
              <li key={q.id} className="rounded-lg border border-zinc-100 p-3">
                <Link href={`/products/${q.productId}`} className="font-medium text-zinc-900 hover:underline">
                  {q.productName}
                </Link>
                <p className="mt-1 text-sm text-zinc-600">{q.content}</p>
                <p className="mt-1 text-xs text-zinc-400">{new Date(q.createdAt).toLocaleDateString("ko-KR")}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">작성한 문의가 없습니다.</p>
        )}
      </div>
      {recentProducts.length > 0 && (
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">최근 본 상품</h2>
          <ul className="space-y-2">
            {recentProducts.map((p) => (
              <li key={p.id}>
                <Link href={`/products/${p.id}`} className="text-sm text-zinc-700 hover:underline">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="card">
        <h2 className="text-lg font-semibold text-zinc-900">비밀번호 변경</h2>
        {!passwordSection ? (
          <button type="button" onClick={() => setPasswordSection(true)} className="btn-secondary mt-4">
            비밀번호 변경
          </button>
        ) : (
          <form onSubmit={handlePasswordChange} className="mt-4 flex flex-col gap-4">
            <label className="block"><span className="label">현재 비밀번호</span><input type="password" placeholder="현재 비밀번호 입력" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-field" /></label>
            <label className="block"><span className="label">새 비밀번호 (8자 이상)</span><input type="password" placeholder="새 비밀번호 입력" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" minLength={8} /></label>
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="btn-primary">변경</button>
              <button type="button" onClick={() => setPasswordSection(false)} className="btn-secondary">취소</button>
            </div>
          </form>
        )}
      </div>
      <div className="card border-red-300/60 bg-red-500/10">
        <h2 className="text-lg font-semibold text-red-700">회원 탈퇴</h2>
        <p className="mt-1 text-sm text-[var(--market-text-muted)]">탈퇴 시 계정이 비활성화되며 복구할 수 없습니다.</p>
        <div className="mt-4 flex flex-col gap-3">
          <label className="block max-w-xs"><span className="label">탈퇴 확인</span><input type="text" placeholder='"탈퇴합니다" 입력' value={withdrawConfirm} onChange={(e) => setWithdrawConfirm(e.target.value)} className="input-field border-red-200 focus:border-red-400 focus:ring-red-400/20" /></label>
          <button type="button" onClick={handleWithdraw} disabled={withdrawConfirm !== "탈퇴합니다" || withdrawing} className="w-fit rounded-lg border border-red-400 bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50">
            {withdrawing ? "처리 중..." : "탈퇴하기"}
          </button>
        </div>
      </div>
      <p className="flex gap-4 text-sm text-[var(--market-text-muted)]">
        <Link href="/orders" className="underline hover:text-[var(--market-accent)]">주문 내역</Link>
        <Link href="/terms" className="underline hover:text-[var(--market-accent)]">이용약관</Link>
        <Link href="/privacy" className="underline hover:text-[var(--market-accent)]">개인정보처리방침</Link>
      </p>
    </div>
  );
}
