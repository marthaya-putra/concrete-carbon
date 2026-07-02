"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ProductWithId, QuartileBounds } from "@/lib/types";
import { CarbonIndicator } from "@/components/carbon-indicator";
import { StageCompletenessIndicator } from "@/components/stage-completeness-indicator";

interface Props {
  product: ProductWithId;
  quartiles: QuartileBounds;
  selected: boolean;
  onToggleSelect: () => void;
  maxReached: boolean;
}

export function ProductCard({ product, quartiles, selected, onToggleSelect, maxReached }: Props) {
  const cf = product.carbonFootprint;

  return (
    <Card
      className={`relative transition-shadow hover:shadow-md ${
        selected ? "ring-2 ring-primary" : ""
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold leading-tight">
              {product.productName}
            </h3>
            <p className="text-sm text-muted-foreground">{product.manufacturer}</p>
          </div>
          <Checkbox
            checked={selected}
            onCheckedChange={onToggleSelect}
            disabled={maxReached && !selected}
            aria-label={`Add ${product.productName} to compare`}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {product.location.state} — {product.location.plantOrRegion}
          </Badge>
          {product.compressiveStrengthMPa !== null ? (
            <Badge variant="secondary">N{product.compressiveStrengthMPa}</Badge>
          ) : (
            <Badge variant="secondary" className="text-muted-foreground">
              N/A
            </Badge>
          )}
        </div>

        {product.epdRegistrationNumber && (
          <p className="text-xs text-muted-foreground">
            EPD: {product.epdRegistrationNumber}
          </p>
        )}

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">A1-A3 (Production)</p>
          <CarbonIndicator
            value={cf.A1_A3.value}
            declared={cf.A1_A3.declared}
            isRange={cf.A1_A3.isRange}
            quartiles={quartiles}
          />
        </div>

        <StageCompletenessIndicator product={product} />

        {product.possibleDuplicate && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            ⚠ Possible duplicate
          </Badge>
        )}

        <Tooltip>
          <TooltipTrigger className="block truncate text-xs text-muted-foreground cursor-help">
            📄 Page {product.pdfPageReference} of {product.sourceEpdFilename}
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="max-w-xs text-xs break-all">
              Source: Page {product.pdfPageReference} of {product.sourceEpdFilename}
            </p>
          </TooltipContent>
        </Tooltip>
      </CardContent>
    </Card>
  );
}
