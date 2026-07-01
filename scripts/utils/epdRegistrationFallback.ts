import { execSync } from "node:child_process";

const EPD_IES_PATTERN = /EPD-IES-\d+(?::\d+)?/g;
const EPD_HUB_PATTERN = /HUB-\d+/g;

/**
 * Extract document-level EPD registration number from the cover page (first 3 pages).
 */
export function extractDocumentRegistration(
  pdfPath: string,
): string | null {
  try {
    const text = execSync(
      `pdftotext -f 1 -l 3 ${JSON.stringify(pdfPath)} -`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    );

    // Pattern: "EPD Registration no./Number/No.: EPD-IES-XXXX:XXX"
    const explicitMatch = text.match(
      /EPD\s+Registration\s+(?:no\.?|Number|No\.?)\s*:?\s*(EPD-IES-\d+(?::\d+)?)/i,
    );
    if (explicitMatch) return explicitMatch[1];

    // Pattern: "EPD HUB, HUB-XXXX"
    const hubMatch = text.match(/EPD\s+HUB[,\s]+(HUB-\d+)/i);
    if (hubMatch) return hubMatch[1];

    return null;
  } catch {
    return null;
  }
}

/**
 * Extract per-product EPD registration number from a PDF.
 *
 * Strategy:
 * 1. Search full PDF text for the product name
 * 2. Look ±20 lines around each match for an EPD-IES or HUB pattern
 * 3. If not found near the product name, fall back to document-level registration
 */
export function extractRegistrationForProduct(
  pdfPath: string,
  productName: string,
): string | null {
  try {
    const text = execSync(
      `pdftotext ${JSON.stringify(pdfPath)} -`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    );

    const lines = text.split("\n");
    const upperName = productName.toUpperCase();

    // Find all line indices where the product name appears
    const matchIndices: number[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toUpperCase().includes(upperName)) {
        matchIndices.push(i);
      }
    }

    // Search ±20 lines around each product name match for registration pattern
    for (const idx of matchIndices) {
      const start = Math.max(0, idx - 20);
      const end = Math.min(lines.length, idx + 21);
      const window = lines.slice(start, end).join("\n");

      // Try EPD-IES pattern first
      const iesMatches = [...window.matchAll(EPD_IES_PATTERN)];
      if (iesMatches.length > 0) {
        return iesMatches[0][0];
      }

      // Try HUB pattern
      const hubMatches = [...window.matchAll(EPD_HUB_PATTERN)];
      if (hubMatches.length > 0) {
        return hubMatches[0][0];
      }
    }

    // Fallback to document-level registration
    return extractDocumentRegistration(pdfPath);
  } catch {
    return null;
  }
}
