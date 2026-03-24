"use client";

/**
 * Global floating action — AI / Livechat entry (placeholder).
 * Shown on every page.
 */
export default function FloatingAssistButton() {
  return (
    <button
      type="button"
      className="fixed bottom-6 right-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-2xl text-white shadow-lg shadow-indigo-500/30 transition hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
      aria-label="AI chat and help (coming soon)"
      title="AI chat (coming soon)"
    >
      💬
    </button>
  );
}
