import { STAGE_META } from "@/lib/stageMeta";

const TONE_CLASSES: Record<string, string> = {
  yellow: "bg-yellow/10 text-yellow",
  orange: "bg-orange/10 text-orange",
  blue: "bg-blue/10 text-blue",
  teal: "bg-teal/10 text-teal",
  green: "bg-green/10 text-green",
};

export function StageBadge({ stage }: { stage: string }) {
  const meta = STAGE_META[stage];
  if (!meta) return null;
  const Icon = meta.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[meta.tone]}`}>
      <Icon size={12} strokeWidth={2.5} />
      {meta.label}
    </span>
  );
}
