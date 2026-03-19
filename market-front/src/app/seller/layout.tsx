"use client";

import SellerHeader from "@/app/components/SellerHeader";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?redirect=/seller");
      return;
    }
    if (user.role !== "SELLER") {
      router.replace("/");
      return;
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "SELLER") {
    return null;
  }

  return (
    <>
      <SellerHeader />
      <main id="main-content" className="market-container min-h-[calc(100vh-4rem)] py-10" tabIndex={-1}>
        {children}
      </main>
    </>
  );
}
