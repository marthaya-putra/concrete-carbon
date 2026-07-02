"use client";

import type { ProductWithId, QuartileBounds } from "@/lib/types";
import { ProductCard } from "@/components/product-card";

interface Props {
  products: ProductWithId[];
  quartiles: QuartileBounds;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  maxReached: boolean;
}

export function ProductGrid({ products, quartiles, selectedIds, onToggleSelect, maxReached }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          quartiles={quartiles}
          selected={selectedIds.has(product.id)}
          onToggleSelect={() => onToggleSelect(product.id)}
          maxReached={maxReached}
        />
      ))}
    </div>
  );
}
