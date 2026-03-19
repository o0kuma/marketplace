"use client";

import HomeShopBelow from "@/app/components/HomeShopBelow";
import HomeSwipePanels from "@/app/components/HomeSwipePanels";
import type { ProductListResponse } from "@/types/product";
import { useCallback, useEffect, useState } from "react";

type Props = {
  categories: { id: number; name: string }[];
  products: ProductListResponse | null;
};

/**
 * Hides #home-shop until "쇼핑 계속하기"; hides again when returning to the paper panel via the strip button.
 */
export default function HomeExperience({ categories, products }: Props) {
  const [shopVisible, setShopVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#home-shop") {
      setShopVisible(true);
    }
  }, []);

  const revealShopBelow = useCallback(() => {
    setShopVisible(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById("home-shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }, []);

  const hideShopBelow = useCallback(() => {
    setShopVisible(false);
  }, []);

  return (
    <>
      <HomeSwipePanels onRevealShopBelow={revealShopBelow} onBackToPaperPanel={hideShopBelow} />
      <div
        id="home-shop"
        className={`market-container scroll-mt-4 px-4 sm:px-6 lg:px-8 ${shopVisible ? "" : "hidden"}`}
        aria-hidden={!shopVisible}
      >
        <HomeShopBelow categories={categories} products={products} />
      </div>
    </>
  );
}
