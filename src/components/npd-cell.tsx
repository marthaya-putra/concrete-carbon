import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function NpdCell() {
  return (
    <Tooltip>
      <TooltipTrigger className="bg-muted/50 text-center text-sm italic text-muted-foreground">
        NPD — Not Declared
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">
          This lifecycle stage was not declared by the manufacturer in the EPD.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
