"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ProductWithId } from "@/lib/types";

const STAGES = [
  { key: "A1_A3" as const, label: "A1-A3 (Production)" },
  { key: "A4" as const, label: "A4 (Transport)" },
  { key: "C1_C4" as const, label: "C1-C4 (Construction)" },
  { key: "D" as const, label: "D (Recycling)" },
];

interface Props {
  product: ProductWithId;
}

export function StageCompletenessIndicator({ product }: Props) {
  const cf = product.carbonFootprint;
  const declaredStages = STAGES.filter((s) => cf[s.key].declared);
  const allDeclared = declaredStages.length === STAGES.length;

  const missingLabels = STAGES.filter((s) => !cf[s.key].declared).map((s) => s.label);

  const tooltipText = allDeclared
    ? "Full lifecycle data available"
    : `Incomplete — ${missingLabels.join(", ")} not declared by manufacturer`;

  return (
    <Tooltip>
      <TooltipTrigger className="inline-flex cursor-help">
        <div className="flex items-center gap-1.5">
          {STAGES.map(({ key, label }) => {
            const declared = cf[key].declared;
            return (
              <div
                key={key}
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-medium ${
                  declared
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-400"
                }`}
                aria-label={`${label}: ${declared ? "declared" : "not declared"}`}
              >
                {declared ? "✓" : "—"}
              </div>
            );
          })}
          <span
            className={`text-xs ${
              allDeclared ? "text-green-600" : "text-muted-foreground"
            }`}
          >
            {allDeclared ? "Complete" : "Incomplete"}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}
