import fs from "node:fs";
import path from "node:path";
import { globSync } from "glob";
import type { ConcreteProduct } from "../src/schemas/product.js";

const DATA_DIR = path.resolve("data");

interface ProductGroup {
  key: string;
  products: ConcreteProduct[];
}

function dedupeKey(p: ConcreteProduct): string {
  return [
    p.manufacturer.toLowerCase(),
    p.productName.toLowerCase(),
    p.compressiveStrengthMPa ?? "unknown",
    p.location.state.toLowerCase(),
    p.location.plantOrRegion.toLowerCase(),
  ].join("|");
}

function main() {
  const jsonFiles = globSync("*.json", { cwd: DATA_DIR, absolute: true });

  if (jsonFiles.length === 0) {
    console.log("No JSON files found in data/. Run extract first.");
    return;
  }

  console.log(`Postprocessing ${jsonFiles.length} product file(s)...`);

  const groups = new Map<string, ConcreteProduct[]>();

  for (const filePath of jsonFiles) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const product: ConcreteProduct = JSON.parse(raw);
    const key = dedupeKey(product);

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(product);
  }

  // Mark duplicates (groups with >1 entry)
  let dupes = 0;
  let updated = 0;

  for (const [, group] of groups) {
    if (group.length > 1) {
      dupes += group.length;
      // Keep the one with most declared values, mark rest as duplicates
      group.sort(
        (a, b) =>
          Object.values(b.carbonFootprint).filter((s) => s.declared).length -
          Object.values(a.carbonFootprint).filter((s) => s.declared).length
      );
      // Best one stays, rest marked as duplicate
      for (let i = 1; i < group.length; i++) {
        group[i].possibleDuplicate = true;
        updated++;
      }
    }
  }

  // Handle range midpoints — already handled during extraction, but log any isRange flags
  let ranges = 0;
  for (const filePath of jsonFiles) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const product: ConcreteProduct = JSON.parse(raw);

    for (const stage of Object.values(product.carbonFootprint) as Array<{
      isRange?: boolean;
      value: number | null;
    }>) {
      if (stage.isRange) {
        ranges++;
      }
    }

    // Re-write with possible updated duplicate flag
    fs.writeFileSync(filePath, JSON.stringify(product, null, 2), "utf-8");
  }

  console.log(`Duplicates detected: ${dupes} (${updated} marked)`);
  console.log(`Range values (midpoints stored): ${ranges}`);
  console.log("Postprocessing complete.");
}

main();
