import { loadAllProducts, computeQuartiles, getFilterOptions } from "@/lib/data";
import { DiscoveryPageClient } from "@/components/discovery-page-client";

export default function DiscoveryPage() {
  const allProducts = loadAllProducts();
  const quartiles = computeQuartiles(allProducts);
  const { states, carbonRangeMin, carbonRangeMax } = getFilterOptions(allProducts);

  return (
    <DiscoveryPageClient
      allProducts={allProducts}
      quartiles={quartiles}
      states={states}
      carbonRangeMin={carbonRangeMin}
      carbonRangeMax={carbonRangeMax}
    />
  );
}
