import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased`}
      >
        <AuthProvider>
          <ToastProvider>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900">
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
