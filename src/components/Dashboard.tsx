"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { Package, AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { TableCard } from "@/components/TableCard";
import { HorizontalStageBars } from "@/components/HorizontalStageBars";
import { SemiDonutGauge } from "@/components/SemiDonutGauge";
import { GanttChart } from "@/components/GanttChart";
import { itemStatus } from "@/lib/labels";
import { STAGE_META } from "@/lib/stageMeta";

type ItemRow = {
  id: string;
  currentStage: string;
  deadline: string | null;
  model: { name: string };
};

type GanttItemRow = {
  id: string;
  currentStage: string;
  stageStart: string;
  deadline: string | null;
  model: { name: string };
};

type DashboardData = {
  countsByStage: Record<string, number>;
  totalItems: number;
  overdueCount: number;
  overdueItems: ItemRow[];
  upcomingDeadlines: ItemRow[];
  activeItems: GanttItemRow[];
};

const SORT_OPTIONS = [
  { value: "deadline_asc", label: "Muddat bo'yicha" },
  { value: "name_asc", label: "Nomi bo'yicha" },
];

export function Dashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [upcomingSearch, setUpcomingSearch] = useState("");
  const [upcomingSort, setUpcomingSort] = useState(SORT_OPTIONS[0].value);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData);
  }, []);

  const filterSort = (rows: ItemRow[], search: string, sort: string) => {
    let list = rows.filter((r) => r.model.name.toLowerCase().includes(search.toLowerCase()));
    list = [...list].sort((a, b) => {
      if (sort === "name_asc") return a.model.name.localeCompare(b.model.name);
      const aTime = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bTime = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return aTime - bTime;
    });
    return list;
  };

  const visibleUpcoming = useMemo(
    () => (data ? filterSort(data.upcomingDeadlines, upcomingSearch, upcomingSort) : []),
    [data, upcomingSearch, upcomingSort]
  );

  if (!data) {
    return (
      <div>
        <div className="text-sm text-ink/50">Yuklanmoqda...</div>
      </div>
    );
  }

  const isAdmin = session?.user?.role === "admin";
  const stageCards = Object.entries(data.countsByStage).map(([stage, count]) => ({
    stage,
    count,
    meta: STAGE_META[stage],
  }));
  const completionPct = data.totalItems > 0 ? ((data.countsByStage.stage_sales ?? 0) / data.totalItems) * 100 : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Jami bandlar" value={data.totalItems} icon={Package} hero />
        {stageCards.map(({ stage, count, meta }) => (
          <StatCard key={stage} label={meta.label} value={count} icon={meta.icon} tone={meta.tone} />
        ))}
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <HorizontalStageBars counts={data.countsByStage} />

          <div className="bg-card rounded-3xl shadow-sm p-5">
            <h3 className="font-display font-bold text-ink mb-4">Bajarilish darajasi</h3>
            <SemiDonutGauge percentage={completionPct} />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-red/10 p-3 text-center">
                <AlertTriangle size={14} className="mx-auto mb-1 text-red" strokeWidth={2} />
                <div className="font-display text-xl font-extrabold text-red">{data.overdueCount}</div>
                <div className="text-xs text-ink/50 mt-0.5">Kechikkan</div>
              </div>
              <div className="rounded-2xl bg-blue/10 p-3 text-center">
                <div className="font-display text-xl font-extrabold text-blue">{data.upcomingDeadlines.length}</div>
                <div className="text-xs text-ink/50 mt-0.5">Yaqin muddatlar</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <GanttChart items={data.activeItems} />

      <TableCard
        title="Yaqinlashayotgan muddatlar"
        count={visibleUpcoming.length}
        search={upcomingSearch}
        onSearchChange={setUpcomingSearch}
        sortValue={upcomingSort}
        onSortChange={setUpcomingSort}
        sortOptions={SORT_OPTIONS}
      >
        <ItemTable items={visibleUpcoming} />
      </TableCard>
    </div>
  );
}

function ItemTable({ items }: { items: ItemRow[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-ink/5 text-left text-xs uppercase tracking-wide text-ink/40">
          <th className="px-5 py-2.5 font-medium">Model</th>
          <th className="px-5 py-2.5 font-medium">Muddat</th>
          <th className="px-5 py-2.5 font-medium">Holat</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const status = itemStatus(item.deadline ? new Date(item.deadline) : null, item.currentStage);
          return (
            <tr key={item.id} className="border-b border-ink/5 last:border-0 h-[52px]">
              <td className="px-5 py-2.5 text-ink">{item.model.name}</td>
              <td className="px-5 py-2.5 text-ink/70">
                {item.deadline ? format(new Date(item.deadline), "dd.MM.yyyy") : "—"}
              </td>
              <td className="px-5 py-2.5">
                <StatusBadge label={status.label} tone={status.tone} />
              </td>
            </tr>
          );
        })}
        {items.length === 0 && (
          <tr>
            <td colSpan={3} className="px-5 py-8 text-center text-sm text-ink/40">
              Bandlar yo&apos;q
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
