"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { RnpSectionData } from "@/lib/parseRnpData";
import { RnpMetricRow } from "@/components/rnp/RnpMetricRow";

export function RnpSection({ section, weekLabels }: { section: RnpSectionData; weekLabels: string[] }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-card rounded-3xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-4 text-left hover:bg-bg"
      >
        <div className="flex items-center gap-2.5">
          <h3 className="font-display font-bold text-ink text-sm sm:text-base">{section.section}</h3>
          <span className="rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-ink/50">
            {section.metrics.length}
          </span>
        </div>
        <ChevronDown
          size={18}
          strokeWidth={2}
          className={`text-ink/40 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-ink/5 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-ink/5">
                <th className="sticky left-0 bg-card" />
                {weekLabels.map((label, i) => (
                  <th
                    key={i}
                    colSpan={1}
                    className="px-3 pt-2 text-right text-[11px] font-semibold text-ink/60 whitespace-nowrap"
                  >
                    {label}
                  </th>
                ))}
              </tr>
              <tr className="text-[10px] uppercase tracking-wide text-ink/40">
                <th className="px-4 sm:px-5 pb-2 text-left font-medium sticky left-0 bg-card">Ko&apos;rsatkich</th>
                {weekLabels.map((_, i) => (
                  <th key={i} className="px-3 pb-2 text-right font-medium whitespace-nowrap">
                    Reja&nbsp;&nbsp;&nbsp;Fakt&nbsp;&nbsp;&nbsp;Nisbat
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.metrics.map((row, i) => (
                <RnpMetricRow key={`${row.metric}-${i}`} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
