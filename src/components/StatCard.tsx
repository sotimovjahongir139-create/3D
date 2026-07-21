import type { LucideIcon } from "lucide-react";

const TONE_CLASSES: Record<string, { badge: string; icon: string }> = {
  yellow: { badge: "bg-yellow/10", icon: "text-yellow" },
  orange: { badge: "bg-orange/10", icon: "text-orange" },
  blue: { badge: "bg-blue/10", icon: "text-blue" },
  teal: { badge: "bg-teal/10", icon: "text-teal" },
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
  tone?: "yellow" | "orange" | "blue" | "teal" | "green" | "red";
  hero?: boolean;
}) {
  if (hero) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-primary p-4 sm:p-5 text-white">
        <span className="absolute right-3 top-3 sm:right-4 sm:top-4 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/20">
          <Icon size={16} strokeWidth={2} className="sm:hidden" />
          <Icon size={18} strokeWidth={2} className="hidden sm:block" />
        </span>
        <div className="font-display text-2xl sm:text-3xl font-extrabold">{value}</div>
        <div className="mt-1 text-xs sm:text-sm text-white/80 truncate pr-8">{label}</div>
      </div>
    );
  }

  const tones = TONE_CLASSES[tone ?? "orange"];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card p-4 sm:p-5 shadow-sm">
      <span className={`absolute right-3 top-3 sm:right-4 sm:top-4 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full ${tones.badge}`}>
        <Icon size={16} strokeWidth={2} className={`sm:hidden ${tones.icon}`} />
        <Icon size={18} strokeWidth={2} className={`hidden sm:block ${tones.icon}`} />
      </span>
      <div className="font-display text-2xl sm:text-3xl font-extrabold text-ink">{value}</div>
      <div className="mt-1 text-xs sm:text-sm text-ink/50 truncate pr-8">{label}</div>
    </div>
  );
}
