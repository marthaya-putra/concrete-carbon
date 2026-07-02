import type { QuartileBounds } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface Props {
  value: number | null;
  declared: boolean;
  isRange?: boolean;
  quartiles: QuartileBounds;
}

export function CarbonIndicator({ value, declared, isRange, quartiles }: Props) {
  if (!declared || value === null) {
    return <Badge variant="secondary">NPD</Badge>;
  }

  const colorClass =
    value <= quartiles.q25
      ? "bg-green-100 text-green-800 border-green-200"
      : value <= quartiles.q75
        ? "bg-amber-100 text-amber-800 border-amber-200"
        : "bg-red-100 text-red-800 border-red-200";

  const prefix = isRange ? "~" : "";

  return (
    <Badge variant="outline" className={colorClass}>
      {prefix}{value} kg CO₂e/m³
    </Badge>
  );
}
