"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import Image from "next/image";
import { StatusBadge } from "@/components/StatusBadge";
import { TableCard } from "@/components/TableCard";
import { PageHeader } from "@/components/PageHeader";
import { itemStatus } from "@/lib/labels";
import { STAGE_META } from "@/lib/stageMeta";

type Item = {
  id: string;
  currentStage: string;
  stageStart: string;
  deadline: string | null;
  model: { name: string; category: string | null; imageUrl: string | null };
};

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "3d": { title: "3D bo'limi", subtitle: "3D bosqichidagi bandlar navbati" },
  mold: { title: "Qolip bo'limi", subtitle: "Qolip bosqichidagi bandlar navbati" },
};

const SORT_OPTIONS = [
  { value: "deadline_asc", label: "Muddat bo'yicha" },
  { value: "name_asc", label: "Nomi bo'yicha" },
];

export function DepartmentQueue({ stage }: { stage: "3d" | "mold" }) {
  const [items, setItems] = useState<Item[]>([]);
  const [finishingId, setFinishingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(SORT_OPTIONS[0].value);

  const load = useCallback(async () => {
    const res = await fetch(`/api/items?stage=${stage}`);
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  }, [stage]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFinish(id: string) {
    setFinishingId(id);
    await fetch(`/api/items/${id}/finish`, { method: "POST" });
    setFinishingId(null);
    load();
  }

  const visibleItems = useMemo(() => {
    let rows = items.filter((i) => i.model.name.toLowerCase().includes(search.toLowerCase()));
    rows = [...rows].sort((a, b) => {
      if (sort === "name_asc") return a.model.name.localeCompare(b.model.name);
      const aTime = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bTime = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return aTime - bTime;
    });
    return rows;
  }, [items, search, sort]);

  const meta = TITLES[stage];
  const Icon = STAGE_META[stage === "3d" ? "stage_3d" : "stage_mold"].icon;

  return (
    <div>
      <PageHeader title={meta.title} subtitle={meta.subtitle} />

      <TableCard
        title="Navbat"
        count={visibleItems.length}
        search={search}
        onSearchChange={setSearch}
        sortValue={sort}
        onSortChange={setSort}
        sortOptions={SORT_OPTIONS}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/5 text-left text-xs uppercase tracking-wide text-ink/40">
              <th className="px-5 py-3 font-medium">Model</th>
              <th className="px-5 py-3 font-medium">Bosqichga tushgan sana</th>
              <th className="px-5 py-3 font-medium">Muddat</th>
              <th className="px-5 py-3 font-medium">Holat</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => {
              const status = itemStatus(item.deadline ? new Date(item.deadline) : null, item.currentStage);
              return (
                <tr key={item.id} className="border-b border-ink/5 last:border-0 h-[56px]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {item.model.imageUrl ? (
                        <Image
                          src={item.model.imageUrl}
                          alt={item.model.name}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bg text-ink/50">
                          <Icon size={15} strokeWidth={2} />
                        </span>
                      )}
                      <div>
                        <div className="font-medium text-ink">{item.model.name}</div>
                        {item.model.category && <div className="text-xs text-ink/40">{item.model.category}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink/70">{format(new Date(item.stageStart), "dd.MM.yyyy")}</td>
                  <td className="px-5 py-3 text-ink/70">
                    {item.deadline ? format(new Date(item.deadline), "dd.MM.yyyy") : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge label={status.label} tone={status.tone} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleFinish(item.id)}
                      disabled={finishingId === item.id}
                      className="rounded-full bg-green px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-green/90 disabled:opacity-60"
                    >
                      Bajarildi
                    </button>
                  </td>
                </tr>
              );
            })}
            {visibleItems.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-ink/40">
                  Navbatda bandlar yo&apos;q
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}
