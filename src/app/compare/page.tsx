import { loadAllProducts } from "@/lib/data";
import { ComparePageClient } from "@/components/compare-page-client";

export const dynamic = "force-static";

export default function ComparePage() {
  const allProducts = loadAllProducts();

  return <ComparePageClient allProducts={allProducts} />;
}
