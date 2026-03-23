import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AppShell from "./components/AppShell";
import FloatingAssistButton from "./components/FloatingAssistButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Open Market — Shop curated products",
  description: "Modern open marketplace — discover products, trusted sellers, secure checkout.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(() => {
            try {
              const saved = localStorage.getItem("theme-mode") || "system";
              const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
              const resolved = saved === "light" || saved === "dark"
                ? saved
                : (systemDark ? "dark" : "light");
              document.documentElement.setAttribute("data-theme", resolved);
              document.documentElement.style.colorScheme = resolved;
            } catch (_) {}
          })();`}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased`}
      >
        <AuthProvider>
          <ToastProvider>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-[var(--market-surface)] focus:px-3 focus:py-2 focus:text-[var(--market-text)] focus:outline-none focus:ring-2 focus:ring-[var(--market-accent)]">
              본문으로 건너뛰기
            </a>
            <AppShell>{children}</AppShell>
            <FloatingAssistButton />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
