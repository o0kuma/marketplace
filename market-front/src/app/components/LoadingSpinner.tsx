"use client";

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20" role="status" aria-label="Loading">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-stone-200 border-t-teal-700" />
      <p className="text-sm font-medium text-stone-500">Loading…</p>
    </div>
  );
}
