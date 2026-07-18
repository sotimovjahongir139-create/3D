import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import type { RnpMetricRow as RnpMetricRowData } from "@/lib/parseRnpData";

const TREND_STYLE: Record<string, string> = {
  up: "bg-green/10 text-green",
  new: "bg-green/10 text-green",
  down: "bg-red/10 text-red",
  flat: "bg-ink/5 text-ink/50",
  zero: "bg-ink/5 text-ink/50",
};

function formatValue(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString("uz-UZ");
}

function RatioBadge({ ratio }: { ratio: RnpMetricRowData["ratio"] }) {
  const style = TREND_STYLE[ratio.trend];

  let icon = null;
  let label = "";

  switch (ratio.trend) {
    case "up":
      icon = <ArrowUp size={12} strokeWidth={2.5} />;
      label = `+${ratio.percent}%`;
      break;
    case "new":
      icon = <ArrowUp size={12} strokeWidth={2.5} />;
      label = "Yangi";
      break;
    case "down":
      icon = <ArrowDown size={12} strokeWidth={2.5} />;
      label = `${ratio.percent}%`;
      break;
    case "flat":
      icon = <Minus size={12} strokeWidth={2.5} />;
      label = "0%";
      break;
    case "zero":
      icon = null;
      label = "0%";
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {icon}
      {label}
    </span>
  );
}

export function RnpMetricRow({ row }: { row: RnpMetricRowData }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[1fr_100px_100px_110px] items-center gap-3 px-4 sm:px-5 py-3 border-b border-ink/5 last:border-0">
      <div className="text-sm font-medium text-ink truncate" title={row.metric}>
        {row.metric}
      </div>
      <div className="text-right text-xs text-ink/50">
        <span className="sm:hidden mr-1">Reja:</span>
        {formatValue(row.currentReja)}
      </div>
      <div className="text-right text-sm font-semibold text-ink">
        <span className="sm:hidden mr-1 text-xs font-normal text-ink/50">Fakt:</span>
        {formatValue(row.currentFakt)}
      </div>
      <div className="flex justify-end">
        <RatioBadge ratio={row.ratio} />
      </div>
    </div>
  );
}
