export default function GlobalLoading() {
  return (
    <div className="flex items-center justify-center py-16" role="status" aria-label="로딩 중">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
    </div>
  );
}
