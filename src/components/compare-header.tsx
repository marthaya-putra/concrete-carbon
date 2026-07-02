"use client";

import type { ProductWithId } from "@/lib/types";

interface Props {
  products: ProductWithId[];
  onRemove: (id: string) => void;
}

export function CompareHeader({ products, onRemove }: Props) {
  return (
    <div className="mb-4 flex gap-4 overflow-x-auto pb-2">
      {products.map((product) => (
        <div
          key={product.id}
          className="relative min-w-48 flex-shrink-0 rounded-lg border bg-muted/50 p-3"
        >
          <button
            onClick={() => onRemove(product.id)}
            className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={`Remove ${product.productName}`}
          >
            ✕
          </button>
          <h3 className="pr-6 text-sm font-semibold leading-tight">
            {product.productName}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{product.manufacturer}</p>
        </div>
      ))}
    </div>
  );
}
