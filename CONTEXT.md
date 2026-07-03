# CONTEXT.md — Concrete Carbon glossary

This file is a **glossary only**. It defines the project's ubiquitous language. It is
*not* a spec, a roadmap, or a place for implementation decisions. Terms are added as
they are resolved during design conversations.

## The domain

**Concrete Carbon** is a comparison tool that makes the carbon footprints declared in
concrete **EPDs** comparable, so the construction industry can choose lower-carbon
materials.

## Terms

- **EPD** (Environmental Product Declaration) — a standardised PDF published by a
  concrete manufacturer, reporting the environmental impacts of one product variant.
  Source of all data in this tool.

- **GWP** (Global Warming Potential) — the carbon impact figure inside an EPD. Reported
  in **kg CO₂-eq**. This tool's "carbon footprint" is GWP.

- **NPD** (Not Declared / "ND" / "MND") — an EPD table marker meaning the manufacturer
  chose not to report a value for a lifecycle stage. Stored as `{ value: null, declared: false }`.

- **Functional unit** — the reference quantity all GWP values are normalised to. For this
  tool: **1 m³ of concrete**. (EPDs sometimes call this the "declared unit".)

- **Compressive strength** — the concrete's characteristic strength in **megapascals
  (MPa)**. In Australia it corresponds to the AS 1379 "N-grade" (e.g. 40 MPa = N40). It
  is a structural specification: a project requiring N50 cannot substitute N20.
  Stored as `compressiveStrengthMPa`.

- **Lifecycle stages** — the four parts of a concrete product's carbon life, per EN 15804:
  - **A1-A3 (Production)** — cradle-to-gate: raw materials, transport to plant, manufacturing.
  - **A4 (Transport)** — gate to construction site.
  - **C1-C4 (Construction / end-of-life)** — demolition, transport, processing, disposal.
  - **D (Recycling)** — beyond the system boundary; a credit, typically **negative**.

- **Carbon-per-MPa** *(validated metric, proceeding to UI)* — `A1-A3 carbon ÷
  compressiveStrengthMPa`. An efficiency metric so that high-strength, carbon-efficient
  mixes are not unfairly ranked below weak mixes. Lower = better. Validated in
  `docs/efficiency-analysis.md`: changes the leaderboard substantially (8/15 top-15
  overlap vs raw A1-A3; 218 of 230 products move ≥5 ranks) and surfaces genuinely
  carbon-efficient high-strength mixes (S6510, S8010, Holcim ECOPact).

## Notes on data quality

- `compressiveStrengthMPa`, all four lifecycle values, `pdfPageReference`, and
  `epdRegistrationNumber` are extracted by an LLM reading the EPD PDF.
- Only `pdfPageReference` and `epdRegistrationNumber` get a deterministic re-check
  against the source PDF (`scripts/extract.ts:142,145`). Strength and carbon values
  do **not** — they are trusted as-extracted.
- **Known extraction hazard:** on dense multi-indicator EPD tables (GWP, PM, IRP, ETP,
  HTP, SQP all in one table), the LLM can grab the wrong row. The most acute instance
  was 27 Hallett products storing PM-row values (~1e-5) as A1-A3 carbon — fixed by
  prompt + schema changes, but cell-level accuracy on dense PDFs is not guaranteed.
  Treat extracted carbon as reliable for *relative* comparison, not as an authoritative
  per-product figure. See `docs/efficiency-analysis.md`.
