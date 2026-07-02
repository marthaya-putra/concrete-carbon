import fs from "node:fs";
import path from "node:path";
import { globSync } from "glob";
import { concreteProductSchema } from "@/schemas/product";
import type { ProductWithId, QuartileBounds } from "./types";

const DATA_DIR = path.resolve(process.cwd(), "data");

export function loadAllProducts(): ProductWithId[] {
  const files = globSync("*.json", { cwd: DATA_DIR, absolute: true });
  const products: ProductWithId[] = [];

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    const result = concreteProductSchema.safeParse(parsed);
    if (!result.success) {
      console.warn(`Skipping invalid product ${path.basename(filePath)}:`, result.error);
      continue;
    }
    const id = path.basename(filePath, ".json");
    products.push({ ...result.data, id });
  }

  return products;
}

export function computeQuartiles(products: ProductWithId[]): QuartileBounds {
  const values = products
    .map((p) => p.carbonFootprint.A1_A3.value)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);

  const n = values.length;
  if (n === 0) return { q25: 0, q50: 0, q75: 0 };

  return {
    q25: values[Math.floor(n * 0.25)],
    q50: values[Math.floor(n * 0.5)],
    q75: values[Math.floor(n * 0.75)],
  };
}

export function getFilterOptions(products: ProductWithId[]) {
  const strengths = [
    ...new Set(
      products
        .map((p) => p.compressiveStrengthMPa)
        .filter((v): v is number => v !== null),
    ),
  ].sort((a, b) => a - b);

  const states = [...new Set(products.map((p) => p.location.state))].sort();

  const a1a3Values = products
    .filter((p) => p.carbonFootprint.A1_A3.declared && p.carbonFootprint.A1_A3.value !== null)
    .map((p) => p.carbonFootprint.A1_A3.value!);

  return {
    strengths,
    states,
    carbonRangeMin: a1a3Values.length > 0 ? Math.min(...a1a3Values) : 0,
    carbonRangeMax: a1a3Values.length > 0 ? Math.max(...a1a3Values) : 500,
  };
}
