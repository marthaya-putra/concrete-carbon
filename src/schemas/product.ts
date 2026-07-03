import { z } from "zod";

/**
 * A lifecycle stage. The canonical app shape is `{ value, declared }`.
 *
 * At extraction time the LLM frequently emits `null` (or omits fields) for
 * stages a manufacturer didn't declare, instead of the object shape. To stay
 * lenient at the extraction boundary without forcing every downstream consumer
 * to null-check, we coerce `null` / non-object input into
 * `{ value: null, declared: false }` here. The rest of the app can rely on the
 * strict object shape.
 */
const lifecycleStage = z.preprocess(
  (val) => {
    if (val === null || val === undefined) {
      return { value: null, declared: false };
    }
    if (typeof val !== "object" || Array.isArray(val)) {
      return { value: null, declared: false };
    }
    return val;
  },
  z.object({
    value: z.number().nullable(),
    declared: z.boolean(),
    isRange: z
      .boolean()
      .optional()
      .describe("True if value was a range, stored as midpoint"),
  }),
);

export const concreteProductSchema = z.object({
  manufacturer: z.string().describe("e.g., Holcim, Boral, Adbri, Hanson"),
  epdProgramOperator: z.string().describe("e.g., EPD Hub, EPD International"),
  sourceEpdFilename: z
    .string()
    .describe("Source filename for auditing, e.g., 'Holcim_EPD.pdf'"),
  epdRegistrationNumber: z
    .string()
    .nullable()
    .default(null)
    .describe(
      "EPD registration number for this specific product variant, e.g., 'EPD-IES-0014785'. Look for columns labeled 'EPD Registration Number', 'Registration No.', 'Reg. No.', or similar.",
    ),
  pdfPageReference: z
    .number()
    .describe("PDF page number where this product's data begins"),
  productName: z
    .string()
    .describe("Commercial/structural name (e.g., EcoPact 40)"),
  compressiveStrengthMPa: z
    .number()
    .nullable()
    .default(null)
    .describe("Integer strength value (e.g., 25, 32, 40, 50)"),
  location: z.object({
    state: z.string().describe("e.g., VIC, NSW, QLD, SA"),
    plantOrRegion: z
      .string()
      .describe("Specific plant or region name (e.g., Rockbank)"),
  }),
  functionalUnit: z.string().default("1 m³"),
  carbonFootprint: z.object({
    A1_A3: lifecycleStage,
    A4: lifecycleStage,
    C1_C4: lifecycleStage,
    D: lifecycleStage,
  }),
  possibleDuplicate: z.boolean().optional().default(false),
});

export type ConcreteProduct = z.infer<typeof concreteProductSchema>;
