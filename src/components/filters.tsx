"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

// AS 1379 standard normal-class grades
const STRENGTH_GRADES = [20, 25, 32, 40, 50] as const;

interface Filters {
  minStrength: number | null;
  state: string | null;
  carbonRange: [number, number];
  completeOnly: boolean;
}

interface Props {
  states: string[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  carbonRangeMin: number;
  carbonRangeMax: number;
  resultCount: number;
}

export function Filters({
  states,
  filters,
  onFiltersChange,
  carbonRangeMin,
  carbonRangeMax,
  resultCount,
}: Props) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="w-40">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Min Strength Grade
        </label>
        <Select
          value={filters.minStrength?.toString() ?? "all"}
          onValueChange={(v) =>
            onFiltersChange({ ...filters, minStrength: v === "all" ? null : Number(v) })
          }
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Any grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any grade</SelectItem>
            {STRENGTH_GRADES.map((s) => (
              <SelectItem key={s} value={s.toString()}>
                N{s}+
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-36">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          State
        </label>
        <Select
          value={filters.state ?? "all"}
          onValueChange={(v) =>
            onFiltersChange({ ...filters, state: v === "all" ? null : v })
          }
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {states.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-64 flex-1">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Carbon A1-A3 Range:{" "}
          <span className="font-mono text-foreground">
            {Math.round(filters.carbonRange[0])} – {Math.round(filters.carbonRange[1])} kg
            CO₂e/m³
          </span>
        </label>
        <Slider
          min={Math.floor(carbonRangeMin)}
          max={Math.ceil(carbonRangeMax)}
          step={5}
          value={filters.carbonRange}
          onValueChange={(v) =>
            onFiltersChange({ ...filters, carbonRange: v as [number, number] })
          }
          className="mt-1"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={filters.completeOnly}
          onCheckedChange={(v) =>
            onFiltersChange({ ...filters, completeOnly: v === true })
          }
        />
        <span className="text-muted-foreground">Complete data only</span>
      </label>

      <div className="text-sm text-muted-foreground">
        {resultCount} product{resultCount !== 1 ? "s" : ""} found
      </div>
    </div>
  );
}
