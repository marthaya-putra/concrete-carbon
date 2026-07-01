import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { glob } from "glob";
import { extractProductsWithRetry } from "./utils/providers.js";
import { extractRegistrationForProduct } from "./utils/epdRegistrationFallback.js";
import type { ConcreteProduct } from "../src/schemas/product.js";

const RAW_EPDS_DIR = path.resolve("raw-epds");
const DATA_DIR = path.resolve("data");
const PROCESSED_DIR = path.resolve("processed-raw-epds");

/**
 * Use Python PyPDF2 to search each page for a product name and return the 1-based page number.
 * Prefers pages with data-table indicators (GWP, MPa, CO2) over cover/header-only mentions.
 * Falls back to the AI-reported page if not found.
 */
function findPageInPdf(
  pdfPath: string,
  productName: string,
  fallbackPage: number,
): number {
  const script = `
import PyPDF2, sys
reader = PyPDF2.PdfReader(sys.argv[1])
name = sys.argv[2].upper()
table_keywords = ["GWP", "MPA", "CO2", "TABLE", "PERFORMANCE"]
first_match = None
for i in range(len(reader.pages)):
    text = (reader.pages[i].extract_text() or "").upper()
    if name in text:
        if first_match is None:
            first_match = i + 1
        if any(kw in text for kw in table_keywords):
            print(i + 1)
            sys.exit(0)
print(first_match if first_match else sys.argv[3])`;
  try {
    const result = execSync(
      `python3 -c ${JSON.stringify(script)} ${JSON.stringify(pdfPath)} ${JSON.stringify(productName)} ${fallbackPage}`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    ).trim();
    return parseInt(result, 10);
  } catch {
    return fallbackPage;
  }
}

/**
 * Validate and correct pdfPageReference for all products by searching the actual PDF.
 */
function validatePageReferences(
  products: ConcreteProduct[],
  pdfPath: string,
  filename: string,
): void {
  let corrected = 0;
  for (const product of products) {
    const actualPage = findPageInPdf(
      pdfPath,
      product.productName,
      product.pdfPageReference,
    );
    if (actualPage !== product.pdfPageReference) {
      console.warn(
        `  ⚠ ${product.productName}: pdfPageReference ${product.pdfPageReference} → ${actualPage} (found in PDF)`,
      );
      product.pdfPageReference = actualPage;
      corrected++;
    }
  }
  if (corrected > 0) {
    console.warn(
      `  ⚠ ${filename}: ${corrected} product(s) had incorrect page references (corrected)`,
    );
  }
}

/**
 * Fallback: if any products have null epdRegistrationNumber, use pdftotext
 * to extract the per-product registration number from the PDF.
 */
function applyRegistrationFallback(
  products: ConcreteProduct[],
  pdfPath: string,
  filename: string,
): void {
  const needsFallback = products.some(
    (p) => p.epdRegistrationNumber === null,
  );
  if (!needsFallback) return;

  let filled = 0;
  for (const product of products) {
    if (product.epdRegistrationNumber === null) {
      const reg = extractRegistrationForProduct(pdfPath, product.productName);
      if (reg) {
        product.epdRegistrationNumber = reg;
        filled++;
      } else {
        console.warn(
          `  WARNING: Could not find EPD registration number for ${product.productName} in ${filename}`,
        );
      }
    }
  }

  if (filled > 0) {
    console.log(
      `  Filled epdRegistrationNumber for ${filled} product(s) via pdftotext fallback`,
    );
  }
}

async function main() {
  // Ensure output dirs exist
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(PROCESSED_DIR, { recursive: true });

  // Find all PDFs
  const pdfFiles = await glob("*.pdf", { cwd: RAW_EPDS_DIR, absolute: true });

  if (pdfFiles.length === 0) {
    console.log("No PDFs found in raw-epds/. Place EPD PDFs there and re-run.");
    return;
  }

  console.log(`Found ${pdfFiles.length} PDF(s) to process.`);

  let totalProducts = 0;
  let errors = 0;

  for (const pdfPath of pdfFiles) {
    const filename = path.basename(pdfPath);
    console.log(`\n--- Processing: ${filename} ---`);

    try {
      const products = await extractProductsWithRetry(pdfPath, filename);
      console.log(`  Extracted ${products.length} product variant(s).`);

      // Validate page references by searching the actual PDF for each product
      validatePageReferences(products, pdfPath, filename);

      // Fallback: fill null registration numbers from PDF via pdftotext
      applyRegistrationFallback(products, pdfPath, filename);

      // Write each product as individual JSON file
      for (const product of products) {
        const safeName = product.productName
          .replace(/[^a-zA-Z0-9]+/g, "_")
          .toLowerCase();
        const safeStrength = product.compressiveStrengthMPa ?? "unknown";
        const safeState = product.location.state.toLowerCase();
        const outputFile = path.join(
          DATA_DIR,
          `${safeName}_${safeStrength}_${safeState}.json`
        );

        fs.writeFileSync(outputFile, JSON.stringify(product, null, 2), "utf-8");
        console.log(`  → ${path.basename(outputFile)}`);
      }

      totalProducts += products.length;

      // Move processed PDF to processed-raw-epds
      const dest = path.join(PROCESSED_DIR, filename);
      fs.renameSync(pdfPath, dest);
      console.log(`  📁 Moved to processed-raw-epds/${filename}`);
    } catch (err) {
      console.error(`  ERROR processing ${filename}:`, err);
      errors++;
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Total products extracted: ${totalProducts}`);
  console.log(`Errors: ${errors}`);
  console.log(`Output: data/*.json`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
