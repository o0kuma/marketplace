import type { ProductListResponse } from "@/types/product";

/**
 * Server-only: loads home shop section from the Spring API (BACKEND_URL).
 * Used by the home page for SSR / faster LCP vs client-only fetch.
 */
export async function fetchHomeShopData(): Promise<{
  products: ProductListResponse | null;
  categories: { id: number; name: string }[];
}> {
  const base = (process.env.BACKEND_URL || "http://localhost:8080").replace(/\/$/, "");
  const productsUrl = `${base}/api/products?page=0&size=8&sortBy=id&direction=desc`;
  const categoriesUrl = `${base}/api/categories`;

  try {
    const [pr, cr] = await Promise.all([
      fetch(productsUrl, { cache: "no-store", headers: { Accept: "application/json" } }),
      fetch(categoriesUrl, { cache: "no-store", headers: { Accept: "application/json" } }),
    ]);
    const products = pr.ok ? ((await pr.json()) as ProductListResponse) : null;
    const categories = cr.ok ? ((await cr.json()) as { id: number; name: string }[]) : [];
    return { products, categories };
  } catch {
    return { products: null, categories: [] };
  }
}
