import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCarbon(value: number | null, isRange?: boolean): string {
  if (value === null) return "NPD";
  const prefix = isRange ? "~" : "";
  return `${prefix}${value} kg CO₂e/m³`;
}
