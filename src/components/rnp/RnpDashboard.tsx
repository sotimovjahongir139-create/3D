"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Calendar } from "lucide-react";
import type { RnpParsedData } from "@/lib/parseRnpData";
import { RnpSection } from "@/components/rnp/RnpSection";

const REFRESH_INTERVAL_MS = 60_000;

function RnpSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-card rounded-3xl shadow-sm p-5 animate-pulse">
          <div className="h-4 w-40 rounded bg-ink/10 mb-4" />
          <div className="space-y-3">
            <div className="h-8 rounded bg-ink/5" />
            <div className="h-8 rounded bg-ink/5" />
            <div className="h-8 rounded bg-ink/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RnpDashboard() {
  const [data, setData] = useState<RnpParsedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/rnp");
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "RNP ma'lumotlarini olishda xatolik yuz berdi");
      }
      const json: RnpParsedData = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "RNP ma'lumotlarini olishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) return <RnpSkeleton />;

  if (error) {
    return (
      <div className="bg-card rounded-3xl shadow-sm p-6 flex items-start gap-3">
        <span className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-red/10 text-red">
          <AlertTriangle size={16} strokeWidth={2} />
        </span>
        <div>
          <div className="font-display font-bold text-ink text-sm">Xatolik yuz berdi</div>
          <p className="mt-1 text-sm text-ink/60">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.sections.length === 0) {
    return <div className="bg-card rounded-3xl shadow-sm px-5 py-10 text-center text-sm text-ink/40">Ma&apos;lumot topilmadi</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-ink/60">
        <Calendar size={15} strokeWidth={2} />
        {data.currentWeekLabel ? (
          <span>
            Joriy hafta: <span className="font-semibold text-ink">{data.currentWeekLabel}</span>
          </span>
        ) : (
          <span>Joriy hafta aniqlanmadi</span>
        )}
      </div>

      <div className="space-y-4">
        {data.sections.map((section) => (
          <RnpSection key={section.section} section={section} />
        ))}
      </div>
    </div>
  );
}
