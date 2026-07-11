import { Filter, ChevronDown } from "lucide-react";

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-ink/50">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-card px-4 py-2 text-sm font-medium text-ink/70 hover:bg-bg">
          Oxirgi 30 kun
          <ChevronDown size={14} />
        </button>
        <button className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          <Filter size={14} />
          Filtrlash
        </button>
      </div>
    </div>
  );
}
