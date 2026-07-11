"use client";

import { Search, ChevronDown } from "lucide-react";

export function TableCard({
  title,
  count,
  search,
  onSearchChange,
  sortValue,
  onSortChange,
  sortOptions,
  children,
}: {
  title: string;
  count?: number;
  search: string;
  onSearchChange: (value: string) => void;
  sortValue: string;
  onSortChange: (value: string) => void;
  sortOptions: { value: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-3xl shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-ink/5">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-bold text-ink">{title}</h3>
          {typeof count === "number" && <span className="text-xs text-ink/40">{count} ta</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Qidirish..."
              className="rounded-full border border-ink/10 bg-bg pl-8 pr-3 py-1.5 text-xs w-40 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="relative">
            <select
              value={sortValue}
              onChange={(e) => onSortChange(e.target.value)}
              className="appearance-none rounded-full border border-ink/10 bg-bg pl-3 pr-7 py-1.5 text-xs focus:border-primary focus:outline-none"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40" />
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
