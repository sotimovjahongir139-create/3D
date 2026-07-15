"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, addMonths, differenceInCalendarDays, endOfMonth, max as maxDate, min as minDate, parseISO, startOfDay, startOfMonth, subMonths } from "date-fns";
import { History } from "lucide-react";
import { STAGE_LABELS } from "@/lib/labels";

type GanttItem = {
  id: string;
  currentStage: string;
  stageStart: string;
  deadline: string | null;
  model: { name: string };
};

type GanttChartProps = {
  items: GanttItem[];
};

const UZ_MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

const DAY_PX = 9;
const STICKY_COL_PX = 148;
const FALLBACK_DURATION_DAYS = 21;
const BACK_MONTHS = 1;
const FORWARD_MONTHS = 3;

export function GanttChart({ items }: GanttChartProps) {
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => startOfDay(new Date()), []);

  const bars = useMemo(
    () =>
      items.map((item) => {
        const start = startOfDay(parseISO(item.stageStart));
        const deadline = item.deadline ? startOfDay(parseISO(item.deadline)) : null;
        const overdueDays = deadline ? Math.max(0, differenceInCalendarDays(today, deadline)) : 0;
        const plannedEnd = deadline ?? maxDate([addDays(start, FALLBACK_DURATION_DAYS), today]);
        const naturalEnd = overdueDays > 0 ? today : plannedEnd;
        const end = naturalEnd > start ? naturalEnd : addDays(start, 1);
        const totalDays = Math.max(1, differenceInCalendarDays(end, start));
        const redWidthDays = Math.min(overdueDays, totalDays);
        const blueWidthDays = Math.max(0, totalDays - redWidthDays);
        return {
          id: item.id,
          modelName: item.model.name,
          stageLabel: STAGE_LABELS[item.currentStage] ?? item.currentStage,
          start,
          end,
          deadline,
          totalDays,
          redWidthDays,
          blueWidthDays,
        };
      }),
    [items, today]
  );

  const defaultRangeStart = useMemo(() => startOfMonth(subMonths(today, BACK_MONTHS)), [today]);
  const defaultRangeEnd = useMemo(() => endOfMonth(addMonths(today, FORWARD_MONTHS)), [today]);

  const rangeStart = useMemo(() => {
    if (!showFullHistory) return defaultRangeStart;
    const earliestStart = bars.length ? minDate(bars.map((b) => b.start)) : defaultRangeStart;
    return startOfMonth(minDate([earliestStart, defaultRangeStart]));
  }, [showFullHistory, bars, defaultRangeStart]);

  const rangeEnd = useMemo(() => {
    const furthestEnd = bars.length ? maxDate(bars.map((b) => b.end)) : defaultRangeEnd;
    return endOfMonth(maxDate([furthestEnd, defaultRangeEnd]));
  }, [bars, defaultRangeEnd]);

  const months = useMemo(() => {
    const result: { start: Date; label: string; totalDays: number; weeks: number[] }[] = [];
    let cursor = startOfMonth(rangeStart);
    while (cursor <= rangeEnd) {
      const monthEnd = endOfMonth(cursor);
      const totalDays = differenceInCalendarDays(monthEnd, cursor) + 1;
      const week4 = Math.max(totalDays - 21, 1);
      result.push({
        start: cursor,
        label: UZ_MONTHS[cursor.getMonth()],
        totalDays,
        weeks: [7, 7, 7, week4],
      });
      cursor = addMonths(cursor, 1);
    }
    return result;
  }, [rangeStart, rangeEnd]);

  const totalDays = differenceInCalendarDays(rangeEnd, rangeStart) + 1;
  const totalWidth = totalDays * DAY_PX;
  const todayOffsetPx = differenceInCalendarDays(today, rangeStart) * DAY_PX;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = Math.max(0, todayOffsetPx - el.clientWidth / 2);
    el.scrollLeft = target;
  }, [todayOffsetPx, showFullHistory]);

  return (
    <div className="bg-card rounded-3xl shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-ink/5">
        <h3 className="font-display font-bold text-ink text-sm sm:text-base">Kechikkan bandlar — jadval</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFullHistory((v) => !v)}
            className="flex items-center gap-1.5 rounded-full border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink/60 hover:bg-bg"
          >
            <History size={13} strokeWidth={2} />
            {showFullHistory ? "Joriy oynani ko'rsatish" : "To'liq tarixni ko'rsatish"}
          </button>
        </div>
      </div>

      {bars.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-ink/40">Bandlar yo&apos;q</div>
      ) : (
        <div ref={scrollRef} className="overflow-x-auto">
          <div style={{ width: STICKY_COL_PX + totalWidth }}>
            <div className="flex sticky top-0 z-20 bg-card">
              <div className="sticky left-0 z-30 bg-card shrink-0 border-b border-ink/5" style={{ width: STICKY_COL_PX }} />
              {months.map((month, i) => (
                <div key={i} className="border-b border-l border-ink/5" style={{ width: month.totalDays * DAY_PX }}>
                  <div className="text-center text-xs font-semibold text-ink/70 py-1 whitespace-nowrap">{month.label}</div>
                  <div className="flex">
                    {month.weeks.map((days, wi) => (
                      <div
                        key={wi}
                        className="text-center text-[10px] text-ink/40 border-l border-ink/5 first:border-l-0 py-0.5"
                        style={{ width: days * DAY_PX }}
                      >
                        {wi + 1}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="relative">
              <div
                className="pointer-events-none absolute top-0 bottom-0 w-px bg-primary/40 z-10"
                style={{ left: STICKY_COL_PX + todayOffsetPx }}
              />
              {bars.map((bar) => {
                const offsetPx = differenceInCalendarDays(bar.start, rangeStart) * DAY_PX;
                const blueWidthPx = bar.blueWidthDays * DAY_PX;
                const redWidthPx = bar.redWidthDays * DAY_PX;
                const deadlineOffsetPx = bar.deadline ? differenceInCalendarDays(bar.deadline, rangeStart) * DAY_PX : null;

                return (
                  <div key={bar.id} className="flex items-center border-b border-ink/5 last:border-0 h-11 relative">
                    <div
                      className="sticky left-0 z-10 bg-card shrink-0 px-3 text-xs font-medium text-ink truncate flex items-center h-full"
                      style={{ width: STICKY_COL_PX }}
                      title={bar.modelName}
                    >
                      {bar.modelName}
                    </div>
                    <div className="relative h-full shrink-0" style={{ width: totalWidth }}>
                      {blueWidthPx > 0 && (
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 h-4 cursor-pointer bg-blue ${
                            redWidthPx > 0 ? "rounded-l-full" : "rounded-full"
                          }`}
                          style={{ left: offsetPx, width: Math.max(blueWidthPx, DAY_PX) }}
                          onMouseEnter={() => setActiveTooltip(bar.id)}
                          onMouseLeave={() => setActiveTooltip(null)}
                          onClick={() => setActiveTooltip((cur) => (cur === bar.id ? null : bar.id))}
                        />
                      )}
                      {redWidthPx > 0 && (
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 h-4 cursor-pointer bg-red ${
                            blueWidthPx > 0 ? "rounded-r-full" : "rounded-full"
                          }`}
                          style={{ left: offsetPx + blueWidthPx, width: Math.max(redWidthPx, DAY_PX) }}
                          onMouseEnter={() => setActiveTooltip(bar.id)}
                          onMouseLeave={() => setActiveTooltip(null)}
                          onClick={() => setActiveTooltip((cur) => (cur === bar.id ? null : bar.id))}
                        />
                      )}
                      {bar.deadline && deadlineOffsetPx !== null && (
                        <span
                          className="absolute -top-1 -translate-x-1/2 text-[10px] font-bold text-red whitespace-nowrap"
                          style={{ left: deadlineOffsetPx }}
                        >
                          {bar.deadline.getDate()}
                        </span>
                      )}
                      {activeTooltip === bar.id && (
                        <div
                          className="absolute -top-2 -translate-y-full z-30 rounded-xl bg-ink px-3 py-2 text-xs text-white shadow-lg whitespace-nowrap"
                          style={{ left: offsetPx }}
                        >
                          <div className="font-semibold">{bar.modelName}</div>
                          <div className="text-white/70">{bar.stageLabel}</div>
                          <div className="text-white/70">
                            {bar.deadline ? `Muddat: ${bar.deadline.toLocaleDateString("uz-UZ")}` : "Muddat belgilanmagan"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
