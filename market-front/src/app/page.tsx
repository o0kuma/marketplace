import HomeExperience from "@/app/components/HomeExperience";
import { fetchHomeShopData } from "@/lib/fetchHomeShopData";

/** Home shop data SSR; strip + shop visibility toggled in HomeExperience. */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { products, categories } = await fetchHomeShopData();
  return <HomeExperience categories={categories} products={products} />;
}
