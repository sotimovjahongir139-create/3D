import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import type { RnpMetricRow as RnpMetricRowData, RnpWeekColumn } from "@/lib/parseRnpData";

const TREND_STYLE: Record<string, string> = {
  up: "bg-green/10 text-green",
  new: "bg-green/10 text-green",
  down: "bg-red/10 text-red",
  flat: "bg-ink/5 text-ink/50",
  zero: "bg-ink/5 text-ink/50",
  pending: "bg-ink/5 text-ink/40",
};

function formatValue(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString("uz-UZ");
}

function RatioBadge({ ratio }: { ratio: RnpWeekColumn["ratio"] }) {
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
    case "pending":
      icon = null;
      label = "—";
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${style}`}>
      {icon}
      {label}
    </span>
  );
}

export function RnpMetricRow({ row }: { row: RnpMetricRowData }) {
  return (
    <tr className="border-b border-ink/5 last:border-0">
      <td className="px-4 sm:px-5 py-3 text-sm font-medium text-ink whitespace-nowrap sticky left-0 bg-card" title={row.metric}>
        {row.metric}
      </td>
      {row.weeks.map((week, i) => (
        <td key={i} className="px-3 py-3">
          <div className="flex items-center justify-end gap-3 whitespace-nowrap">
            <span className="text-xs text-ink/50">{formatValue(week.reja)}</span>
            <span className="text-sm font-semibold text-ink">{formatValue(week.fakt)}</span>
            <RatioBadge ratio={week.ratio} />
          </div>
        </td>
      ))}
    </tr>
  );
}
