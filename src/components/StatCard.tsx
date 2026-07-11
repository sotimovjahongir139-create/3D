import type { LucideIcon } from "lucide-react";

const TONE_CLASSES: Record<string, { badge: string; icon: string }> = {
  orange: { badge: "bg-orange/10", icon: "text-orange" },
  blue: { badge: "bg-blue/10", icon: "text-blue" },
  green: { badge: "bg-green/10", icon: "text-green" },
  red: { badge: "bg-red/10", icon: "text-red" },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  hero,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "orange" | "blue" | "green" | "red";
  hero?: boolean;
}) {
  if (hero) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-primary p-5 text-white">
        <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
          <Icon size={18} strokeWidth={2} />
        </span>
        <div className="font-display text-3xl font-extrabold">{value}</div>
        <div className="mt-1 text-sm text-white/80">{label}</div>
      </div>
    );
  }

  const tones = TONE_CLASSES[tone ?? "orange"];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card p-5 shadow-sm">
      <span className={`absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full ${tones.badge}`}>
        <Icon size={18} strokeWidth={2} className={tones.icon} />
      </span>
      <div className="font-display text-3xl font-extrabold text-ink">{value}</div>
      <div className="mt-1 text-sm text-ink/50">{label}</div>
    </div>
  );
}
