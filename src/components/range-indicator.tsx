import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  value: number;
  children: React.ReactNode;
}

export function RangeIndicator({ value, children }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger className="cursor-help">{children}</TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">
          This is a midpoint estimate from a range. Actual value may vary.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
