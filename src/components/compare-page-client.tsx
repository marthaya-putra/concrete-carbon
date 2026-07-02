"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useCallback } from "react";
import Link from "next/link";
import type { ProductWithId } from "@/lib/types";
import { CompareHeader } from "@/components/compare-header";
import { HonestTable } from "@/components/honest-table";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Props {
  allProducts: ProductWithId[];
}

export function ComparePageClient({ allProducts }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const products = useMemo(() => {
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
    return ids
      .map((id) => allProducts.find((p) => p.id === id))
      .filter((p): p is ProductWithId => p !== undefined);
  }, [allProducts, searchParams]);

  const removeProduct = useCallback(
    (id: string) => {
      const currentIds = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
      const newIds = currentIds.filter((i) => i !== id);
      if (newIds.length > 0) {
        router.push(`/compare?ids=${newIds.join(",")}`);
      } else {
        router.push("/");
      }
    },
    [router, searchParams],
  );

  if (products.length === 0) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center px-4 py-16">
        <p className="text-lg text-muted-foreground">No products selected for comparison.</p>
        <Link href="/" className="mt-4 text-primary underline hover:text-primary/80">
          Go to Discovery
        </Link>
      </div>
    );
  }

  if (products.length === 1) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center px-4 py-16">
        <p className="text-lg text-muted-foreground">
          Select at least 2 products to compare.
        </p>
        <Link href="/" className="mt-4 text-primary underline hover:text-primary/80">
          Go to Discovery
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm">
              ← Back to Search
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <h1 className="text-lg font-semibold">
            Comparing {products.length} product{products.length > 1 ? "s" : ""}
          </h1>
        </div>
      </div>

      <CompareHeader products={products} onRemove={removeProduct} />
      <HonestTable products={products} />
    </div>
  );
}
