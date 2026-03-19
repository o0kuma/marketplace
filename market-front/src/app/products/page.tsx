import LoadingSpinner from "@/app/components/LoadingSpinner";
import { Suspense } from "react";
import ProductsCatalog from "./ProductsCatalog";

export default function ProductsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProductsCatalog />
    </Suspense>
  );
}
