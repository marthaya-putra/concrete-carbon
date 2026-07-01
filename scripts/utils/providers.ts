import fs from "node:fs";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { generateText, Output } from "ai";
import {
  concreteProductSchema,
  type ConcreteProduct,
} from "../../src/schemas/product.js";
import dotenv from "dotenv";
dotenv.config();

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
const mistral = createMistral({ apiKey: process.env.MISTRAL_API_KEY });

const SYSTEM_PROMPT = `You are an expert at extracting environmental product declaration (EPD) data for concrete products from Australian manufacturers.

Rules:
- Extract ALL product variants found in the document. Each unique strength/location combination is a separate product.
- Carbon footprint values (A1-A3, A4, C1-C4, D) are in kg CO₂-eq per m³ unless stated otherwise.
- CRITICAL TABLE SCANNING RULE: For environmental impact tables (such as GWP/Global Warming Potential), you MUST scan every column from left to right across the entire row. Do not stop at C4. Find and extract the value under column 'D' (often labeled "Beyond the system boundary" or "Benefits and loads").
- For module D values, note that credits are typically negative; you MUST preserve the negative sign (e.g., -1.22E+01).
- If an "X" is marked in the lifecycle stage matrix for a module, or if a numerical value exists in the data tables, set declared: true.
- If a lifecycle stage is explicitly marked "ND", "MND", or left completely blank/omitted from the data tables, set declared: false and value: null.
- If a value is reported as a range (e.g., "220-250"), store the midpoint (235) and set isRange: true.
- State codes: VIC, NSW, QLD, SA, WA, TAS, ACT, NT.
- Compressive strength should be an integer (round if needed).
- Be precise with manufacturer names — use the exact legal entity name shown in the EPD.
- pdfPageReference should be the page where this product's data table begins.
- EPD REGISTRATION NUMBER: You MUST find and extract the EPD registration number for each product variant. This is the single most important identifier for traceability — NEVER leave it as null.
  - In project-specific EPDs with summary tables, registration numbers are often in a side-by-side column layout: product names on the LEFT, registration numbers on the RIGHT column. Scan BOTH columns carefully.
  - Each product variant typically has its OWN unique registration number (e.g., BN402BO31 → EPD-IES-0014761:001). Do NOT assign the same number to all products.
  - For EPD Hub documents, the identifier typically appears on the first page as "EPD HUB, HUB-XXXX" — use that format.
  - If you cannot find a per-product registration number in the data tables, use the document-level registration number from the cover page as a fallback.`;

export async function extractProductsWithRetry(
  pdfPath: string,
  filename: string,
): Promise<ConcreteProduct[]> {
  const backoffDelays = [30_000, 60_000, 120_000];

  // Try Gemini first
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await attemptExtraction(pdfPath, filename, "gemini");
    } catch (err: any) {
      const isRetryable =
        err?.message?.includes("429") ||
        err?.status === 429 ||
        err?.message?.includes("quota");
      if (!isRetryable || attempt === 2) {
        if (!isRetryable) throw err;
        break; // exhausted retries, fall through to Mistral
      }
      console.warn(
        `Gemini rate limited, backing off ${backoffDelays[attempt] / 1000}s (attempt ${attempt + 1}/3)...`,
      );
      await new Promise((r) => setTimeout(r, backoffDelays[attempt]));
    }
  }

  // Fallback to Mistral (also vision-capable)
  console.warn("Gemini exhausted, falling back to Mistral...");
  try {
    return await attemptExtraction(pdfPath, filename, "mistral");
  } catch (err) {
    console.error("Mistral also failed:", err);
    throw err;
  }
}

async function attemptExtraction(
  pdfPath: string,
  filename: string,
  provider: "gemini" | "mistral",
): Promise<ConcreteProduct[]> {
  const model =
    provider === "gemini"
      ? google("gemini-2.5-flash-lite")
      : mistral("mistral-small-latest");

  const pdfBuffer = fs.readFileSync(pdfPath);

  const { output } = await generateText({
    model,
    output: Output.object({
      schema: concreteProductSchema.array(),
    }),
    system: SYSTEM_PROMPT,
    prompt: [
      {
        role: "user",
        content: [
          {
            type: "file",
            data: pdfBuffer,
            mediaType: "application/pdf",
            filename,
          },
          {
            type: "text",
            text: `Extract all concrete product variants from this EPD document. Source filename: ${filename}`,
          },
        ],
      },
    ],
    maxRetries: 1,
  });

  if (!output) {
    throw new Error(`No structured output returned from ${provider}`);
  }

  return output.map((p) => ({
    ...p,
    sourceEpdFilename: filename,
    epdRegistrationNumber: p.epdRegistrationNumber ?? null,
    functionalUnit: "1 m³", // always standardize — concrete EPDs are per m³
    possibleDuplicate: p.possibleDuplicate ?? false,
  }));
}
