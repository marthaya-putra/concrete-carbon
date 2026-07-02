"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import type { ProductWithId, QuartileBounds } from "@/lib/types";
import { Filters } from "@/components/filters";
import { ProductGrid } from "@/components/product-grid";
import { Button } from "@/components/ui/button";

interface Props {
  allProducts: ProductWithId[];
  quartiles: QuartileBounds;
  states: string[];
  carbonRangeMin: number;
  carbonRangeMax: number;
}

export function DiscoveryPageClient({
  allProducts,
  quartiles,
  states,
  carbonRangeMin,
  carbonRangeMax,
}: Props) {
  const [filters, setFilters] = useState({
    minStrength: null as number | null,
    state: null as string | null,
    carbonRange: [carbonRangeMin, carbonRangeMax] as [number, number],
    completeOnly: false,
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((p) => {
        if (filters.minStrength !== null && (p.compressiveStrengthMPa === null || p.compressiveStrengthMPa < filters.minStrength)) return false;
        if (filters.state !== null && p.location.state !== filters.state) return false;
        const a1 = p.carbonFootprint.A1_A3;
        if (a1.declared && a1.value !== null) {
          if (a1.value < filters.carbonRange[0] || a1.value > filters.carbonRange[1]) return false;
        }
        if (filters.completeOnly) {
          const cf = p.carbonFootprint;
          if (!cf.A1_A3.declared || !cf.A4.declared || !cf.C1_C4.declared || !cf.D.declared) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aVal = a.carbonFootprint.A1_A3.value;
        const bVal = b.carbonFootprint.A1_A3.value;
        if (aVal === null && bVal === null) return 0;
        if (aVal === null) return 1;
        if (bVal === null) return -1;
        return aVal - bVal;
      });
  }, [allProducts, filters]);

  const toggleSelect = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else if (next.size < 4) {
          next.add(id);
        }
        return next;
      });
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters({
      minStrength: null,
      state: null,
      carbonRange: [carbonRangeMin, carbonRangeMax],
      completeOnly: false,
    });
  }, [carbonRangeMin, carbonRangeMax]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return (
    <div>
      <div className="sticky top-14 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <Filters
            states={states}
            filters={filters}
            onFiltersChange={setFilters}
            carbonRangeMin={carbonRangeMin}
            carbonRangeMax={carbonRangeMax}
            resultCount={filteredProducts.length}
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <ProductGrid
          products={filteredProducts}
          quartiles={quartiles}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          maxReached={selectedIds.size >= 4}
        />

        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg text-muted-foreground">No products match your filters.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try broadening your carbon range or selecting a different state.
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 text-sm text-primary underline hover:text-primary/80"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-full border bg-background px-4 py-2 shadow-lg">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size}/4 selected
            </span>
            <Link href={`/compare?ids=${Array.from(selectedIds).join(",")}`}>
              <Button size="sm">Compare ({selectedIds.size})</Button>
            </Link>
            <button
              onClick={clearSelection}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
