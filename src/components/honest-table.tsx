"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Fragment } from "react";
import type { ProductWithId } from "@/lib/types";
import { NpdCell } from "@/components/npd-cell";
import { RangeIndicator } from "@/components/range-indicator";

type StageKey = "A1_A3" | "A4" | "C1_C4" | "D";

const STAGES: { key: StageKey; label: string }[] = [
  { key: "A1_A3", label: "A1-A3 (Production)" },
  { key: "A4", label: "A4 (Transport)" },
  { key: "C1_C4", label: "C1-C4 (Construction)" },
  { key: "D", label: "D (Recycling)" },
];

interface Props {
  products: ProductWithId[];
}

function renderStageCell(product: ProductWithId, stageKey: StageKey) {
  const stage = product.carbonFootprint[stageKey];

  if (!stage.declared || stage.value === null) {
    return <NpdCell />;
  }

  const value = stage.value;
  const isNegative = value < 0;
  const prefix = stage.isRange ? "~" : "";
  const display = `${prefix}${value} kg CO₂e/m³`;

  if (stage.isRange) {
    return (
      <td className={`text-center text-sm ${isNegative ? "text-green-600" : ""}`}>
        <RangeIndicator value={value}>{display}</RangeIndicator>
      </td>
    );
  }

  return (
    <td className={`text-center text-sm ${isNegative ? "text-green-600" : ""}`}>
      {display}
    </td>
  );
}

function canComputeTotal(products: ProductWithId[]): boolean {
  return products.every((p) =>
    STAGES.every(
      (s) => p.carbonFootprint[s.key].declared && p.carbonFootprint[s.key].value !== null,
    ),
  );
}

function computeTotal(product: ProductWithId): number {
  return STAGES.reduce((sum, s) => sum + (product.carbonFootprint[s.key].value ?? 0), 0);
}

export function HonestTable({ products }: Props) {
  const allTotalsComputable = canComputeTotal(products);

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 min-w-44 bg-background z-10">
              Property
            </TableHead>
            {products.map((p) => (
              <TableHead key={p.id} className="min-w-48 text-center">
                {p.productName}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Basic info rows */}
          <TableRow>
            <TableCell className="sticky left-0 bg-background font-medium z-10">
              Manufacturer
            </TableCell>
            {products.map((p) => (
              <TableCell key={p.id} className="text-center text-sm">
                {p.manufacturer}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="sticky left-0 bg-background font-medium z-10">
              Location
            </TableCell>
            {products.map((p) => (
              <TableCell key={p.id} className="text-center text-sm">
                {p.location.state} — {p.location.plantOrRegion}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="sticky left-0 bg-background font-medium z-10">
              Strength
            </TableCell>
            {products.map((p) => (
              <TableCell key={p.id} className="text-center text-sm">
                {p.compressiveStrengthMPa !== null
                  ? `N${p.compressiveStrengthMPa}`
                  : "N/A"}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="sticky left-0 bg-background font-medium z-10">
              EPD Registration
            </TableCell>
            {products.map((p) => (
              <TableCell key={p.id} className="text-center text-sm">
                {p.epdRegistrationNumber ?? "—"}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="sticky left-0 bg-background font-medium z-10">
              EPD Operator
            </TableCell>
            {products.map((p) => (
              <TableCell key={p.id} className="text-center text-sm">
                {p.epdProgramOperator}
              </TableCell>
            ))}
          </TableRow>

          {/* Lifecycle stages */}
          {STAGES.map((stage) => (
            <TableRow key={stage.key}>
              <TableCell className="sticky left-0 bg-background font-medium z-10">
                {stage.label}
              </TableCell>
              {products.map((p) => (
                <Fragment key={p.id}>{renderStageCell(p, stage.key)}</Fragment>
              ))}
            </TableRow>
          ))}

          {/* Total lifecycle row */}
          <TableRow className="bg-muted/30">
            <TableCell className="sticky left-0 bg-muted/30 font-semibold z-10">
              Total Lifecycle (A1-A3 + A4 + C1-C4 + D)
            </TableCell>
            {allTotalsComputable ? (
              products.map((p) => (
                <TableCell key={p.id} className="text-center text-sm font-semibold">
                  {computeTotal(p)} kg CO₂e/m³
                </TableCell>
              ))
            ) : (
              <TableCell
                colSpan={products.length}
                className="text-center text-sm text-destructive"
              >
                ❌ Cannot calculate total — incomplete lifecycle data for one or more products
              </TableCell>
            )}
          </TableRow>

          {/* Provenance row */}
          <TableRow>
            <TableCell className="sticky left-0 bg-background font-medium z-10">
              Source
            </TableCell>
            {products.map((p) => (
              <TableCell key={p.id} className="text-center text-xs text-muted-foreground">
                📄 Page {p.pdfPageReference} of {p.sourceEpdFilename}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
