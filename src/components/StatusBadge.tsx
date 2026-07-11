const TONE_CLASSES: Record<string, string> = {
  overdue: "bg-red/10 text-red",
  progress: "bg-orange/10 text-orange",
  done: "bg-green/10 text-green",
  sample: "bg-blue/10 text-blue",
};

export function StatusBadge({ label, tone }: { label: string; tone: keyof typeof TONE_CLASSES }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[tone]}`}>
      {label}
    </span>
  );
}
