"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Package, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { HorizontalStageBars } from "@/components/HorizontalStageBars";
import { SemiDonutGauge } from "@/components/SemiDonutGauge";
import { GanttChart } from "@/components/GanttChart";
import { STAGE_META } from "@/lib/stageMeta";

type GanttItemRow = {
  id: string;
  currentStage: string;
  stageStart: string;
  deadline: string | null;
  model: { name: string; category: string | null; imageUrl: string | null };
  logs: { stage: string; startDate: string; endDate: string }[];
};

type DashboardData = {
  countsByStage: Record<string, number>;
  totalItems: number;
  overdueCount: number;
  upcomingDeadlines: unknown[];
  activeItems: GanttItemRow[];
};

export function Dashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData);
  }, []);

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
    </div>
  );
}
