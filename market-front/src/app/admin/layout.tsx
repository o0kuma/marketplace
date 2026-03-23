"use client";

import AdminHeader from "@/app/components/AdminHeader";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?redirect=/admin");
      return;
    }
    if (user.role !== "ADMIN") {
      router.replace("/");
      return;
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <AdminHeader />
      <main id="main-content" className="market-container min-h-[calc(100vh-4rem)] py-10" tabIndex={-1}>
        {children}
      </main>
    </>
  );
}
