import { STAGE_META } from "@/lib/stageMeta";

const BAR_CLASSES: Record<string, string> = {
  yellow: "bg-yellow",
  orange: "bg-orange",
  blue: "bg-blue",
  teal: "bg-teal",
  green: "bg-green",
};

const BADGE_CLASSES: Record<string, string> = {
  yellow: "bg-yellow/10",
  orange: "bg-orange/10",
  blue: "bg-blue/10",
  teal: "bg-teal/10",
  green: "bg-green/10",
};

const ICON_CLASSES: Record<string, string> = {
  yellow: "text-yellow",
  orange: "text-orange",
  blue: "text-blue",
  teal: "text-teal",
  green: "text-green",
};

export function HorizontalStageBars({ counts }: { counts: Record<string, number> }) {
  const stages = Object.keys(STAGE_META).filter((s) => s in counts);
  const max = Math.max(1, ...stages.map((s) => counts[s] ?? 0));

  return (
    <div className="bg-card rounded-3xl shadow-sm p-5">
      <h3 className="font-display font-bold text-ink mb-5">Bosqichlar bo&apos;yicha bandlar</h3>
      <div className="space-y-5">
        {stages.map((stage) => {
          const meta = STAGE_META[stage];
          const Icon = meta.icon;
          const count = counts[stage] ?? 0;
          const pct = Math.round((count / max) * 100);
          return (
            <div key={stage} className="flex items-center gap-3">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${BADGE_CLASSES[meta.tone]}`}>
                <Icon size={16} strokeWidth={2} className={ICON_CLASSES[meta.tone]} />
              </span>
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-ink/60">{meta.label}</span>
                  <span className="font-semibold text-ink">{count}</span>
                </div>
                <div className="h-2.5 rounded-full bg-bg overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${BAR_CLASSES[meta.tone]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
