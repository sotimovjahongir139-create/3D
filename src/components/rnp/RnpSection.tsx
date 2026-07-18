"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { RnpSectionData } from "@/lib/parseRnpData";
import { RnpMetricRow } from "@/components/rnp/RnpMetricRow";

export function RnpSection({ section }: { section: RnpSectionData }) {
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
        <div className="border-t border-ink/5">
          <div className="hidden sm:grid grid-cols-[1fr_100px_100px_110px] gap-3 px-5 py-2 text-xs uppercase tracking-wide text-ink/40">
            <span>Ko&apos;rsatkich</span>
            <span className="text-right">Reja</span>
            <span className="text-right">Fakt</span>
            <span className="text-right">Nisbat</span>
          </div>
          {section.metrics.map((row, i) => (
            <RnpMetricRow key={`${row.metric}-${i}`} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}
