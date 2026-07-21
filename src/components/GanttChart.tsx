"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, addMonths, differenceInCalendarDays, endOfMonth, max as maxDate, min as minDate, parseISO, startOfDay, startOfMonth, subMonths } from "date-fns";
import { AlertTriangle, History } from "lucide-react";
import { STAGE_LABELS } from "@/lib/labels";
import { ModelThumb } from "@/components/ModelThumb";
import { ModelDetailModal, type ModelDetail } from "@/components/ModelDetailModal";

type GanttItem = {
  id: string;
  currentStage: string;
  stageStart: string | null;
  deadline: string | null;
  model: { name: string; category: string | null; imageUrl: string | null };
  logs: { stage: string; startDate: string; endDate: string }[];
};

type GanttChartProps = {
  items: GanttItem[];
};

type Segment = { stage: string; start: Date; end: Date };
type WeekCell = { start: Date; end: Date; offsetPx: number; widthPx: number };

const UZ_MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

const STAGE_BAR_COLOR: Record<string, string> = {
  stage_3d: "bg-red",
  stage_mold: "bg-blue",
  stage_sales: "bg-green",
};

const DAY_PX = 10;
const STICKY_COL_PX = 200;
const THUMB_SIZE = 26;
const FALLBACK_DURATION_DAYS = 14; // used only when a stage has no deadline set yet
const BACK_MONTHS = 1;
const FORWARD_MONTHS = 3;

export function GanttChart({ items }: GanttChartProps) {
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<ModelDetail | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => startOfDay(new Date()), []);

  const bars = useMemo(
    () =>
      items.map((item) => {
        const segments: Segment[] = [...item.logs]
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
          .map((log) => ({
            stage: log.stage,
            start: startOfDay(parseISO(log.startDate)),
            end: startOfDay(parseISO(log.endDate)),
          }));

        const explicitStart = item.stageStart ? startOfDay(parseISO(item.stageStart)) : null;
        const deadline = item.deadline ? startOfDay(parseISO(item.deadline)) : null;
        // Bars are a static planned schedule: width is fixed from start -> due date,
        // computed once from the data, never recalculated against today. When there's
        // no real start date, pin the segment to the due date itself rather than
        // fabricating a start - that collapses it to a single compact week-cell
        // instead of stretching from some arbitrary point to the due date.
        const effectiveStart = explicitStart ?? deadline;
        if (effectiveStart) {
          const plannedEnd = deadline ?? addDays(effectiveStart, FALLBACK_DURATION_DAYS);
          const currentEnd = plannedEnd > effectiveStart ? plannedEnd : addDays(effectiveStart, 1);
          segments.push({ stage: item.currentStage, start: effectiveStart, end: currentEnd });
        }

        const overdue = deadline ? today > deadline : false;

        return {
          id: item.id,
          modelName: item.model.name,
          modelCategory: item.model.category,
          modelImageUrl: item.model.imageUrl,
          currentStage: item.currentStage,
          stageStart: item.stageStart,
          stageLabel: STAGE_LABELS[item.currentStage] ?? item.currentStage,
          deadline: item.deadline,
          deadlineDate: deadline,
          overdue,
          segments,
          overallStart: segments[0]?.start ?? today,
        };
      }),
    [items, today]
  );

  const defaultRangeStart = useMemo(() => startOfMonth(subMonths(today, BACK_MONTHS)), [today]);
  const defaultRangeEnd = useMemo(() => endOfMonth(addMonths(today, FORWARD_MONTHS)), [today]);

  const rangeStart = useMemo(() => {
    if (!showFullHistory) return defaultRangeStart;
    const earliestStart = bars.length ? minDate(bars.map((b) => b.overallStart)) : defaultRangeStart;
    return startOfMonth(minDate([earliestStart, defaultRangeStart]));
  }, [showFullHistory, bars, defaultRangeStart]);

  const rangeEnd = useMemo(() => {
    const deadlines = bars.map((b) => b.deadlineDate).filter((d): d is Date => d !== null);
    const furthest = deadlines.length ? maxDate(deadlines) : defaultRangeEnd;
    return endOfMonth(maxDate([furthest, defaultRangeEnd, today]));
  }, [bars, defaultRangeEnd, today]);

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

  // Same week-cell partitioning as the header grid (months -> [7,7,7,week4] day
  // groups), flattened into one array with each cell's pixel position. Bars snap
  // to these cell boundaries instead of exact day offsets, so a bar's edges
  // always land on a grid line like the header, never a fractional day/pixel.
  const weekCells = useMemo(() => {
    const cells: WeekCell[] = [];
    let offsetPx = 0;
    months.forEach((month) => {
      let cursor = month.start;
      month.weeks.forEach((days) => {
        const end = addDays(cursor, days);
        cells.push({ start: cursor, end, offsetPx, widthPx: days * DAY_PX });
        offsetPx += days * DAY_PX;
        cursor = end;
      });
    });
    return cells;
  }, [months]);

  const cellIndexForDate = (date: Date): number => {
    for (let i = 0; i < weekCells.length; i++) {
      if (date >= weekCells[i].start && date < weekCells[i].end) return i;
    }
    if (weekCells.length === 0) return 0;
    return date < weekCells[0].start ? 0 : weekCells.length - 1;
  };

  // Vertical gridlines for the body rows, computed once (not per row): a strong
  // line at each month start, thin lines at the week subdivisions within it.
  const gridLines = useMemo(() => {
    const lines: { offsetPx: number; strong: boolean }[] = [];
    months.forEach((month) => {
      const monthOffsetPx = differenceInCalendarDays(month.start, rangeStart) * DAY_PX;
      lines.push({ offsetPx: monthOffsetPx, strong: true });
      let acc = monthOffsetPx;
      month.weeks.slice(0, -1).forEach((days) => {
        acc += days * DAY_PX;
        lines.push({ offsetPx: acc, strong: false });
      });
    });
    return lines;
  }, [months, rangeStart]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = Math.max(0, todayOffsetPx - el.clientWidth / 2);
    el.scrollLeft = target;
  }, [todayOffsetPx, showFullHistory]);

  return (
    <div className="bg-card rounded-3xl shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-ink/5">
        <h3 className="font-display font-bold text-ink text-sm sm:text-base">Gantt chart</h3>
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
              <div
                className="sticky left-0 z-30 bg-card shrink-0 border-b border-r border-ink/15"
                style={{ width: STICKY_COL_PX }}
              />
              {months.map((month, i) => (
                <div key={i} className="border-b border-l border-ink/15" style={{ width: month.totalDays * DAY_PX }}>
                  <div className="text-center text-xs font-semibold text-ink/70 py-1 whitespace-nowrap">{month.label}</div>
                  <div className="flex">
                    {month.weeks.map((days, wi) => (
                      <div
                        key={wi}
                        className="text-center text-[10px] text-ink/40 border-l border-ink/10 first:border-l-0 py-0.5"
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
              {gridLines.map((line, i) => (
                <div
                  key={i}
                  className={`pointer-events-none absolute top-0 bottom-0 w-px ${line.strong ? "bg-ink/15" : "bg-ink/8"}`}
                  style={{ left: STICKY_COL_PX + line.offsetPx }}
                />
              ))}
              <div
                className="pointer-events-none absolute top-0 bottom-0 w-px bg-primary/40 z-10"
                style={{ left: STICKY_COL_PX + todayOffsetPx }}
              />
              {bars.map((bar) => {
                const openDetail = () =>
                  setSelectedDetail({
                    name: bar.modelName,
                    category: bar.modelCategory,
                    imageUrl: bar.modelImageUrl,
                    currentStage: bar.currentStage,
                    stageStart: bar.stageStart,
                    deadline: bar.deadline,
                  });

                // Snap each segment to whole week-cells (start's cell -> end's
                // cell, both inclusive). Adjacent segments share their boundary
                // date, which would otherwise make both claim the same cell -
                // resolve that by letting the later segment win the contested
                // cell, so segments sit flush with no gap or overlap.
                const cellRanges = bar.segments.map((segment) => ({
                  startIdx: cellIndexForDate(segment.start),
                  endIdx: cellIndexForDate(segment.end),
                }));
                for (let i = 1; i < cellRanges.length; i++) {
                  if (cellRanges[i].startIdx <= cellRanges[i - 1].endIdx) {
                    cellRanges[i - 1].endIdx = Math.max(cellRanges[i - 1].startIdx, cellRanges[i].startIdx - 1);
                  }
                }

                return (
                  <div key={bar.id} className="flex items-center border-b border-ink/15 h-9 relative">
                    <button
                      type="button"
                      onClick={openDetail}
                      className="sticky left-0 z-10 bg-card shrink-0 border-r border-ink/15 px-3 flex items-center gap-2 h-full text-left hover:bg-bg"
                      style={{ width: STICKY_COL_PX }}
                      title={bar.modelName}
                    >
                      <ModelThumb src={bar.modelImageUrl} alt={bar.modelName} size={THUMB_SIZE} rounded="lg" />
                      <span className="text-xs font-medium text-ink truncate">{bar.modelName}</span>
                      {bar.overdue && (
                        <AlertTriangle size={13} strokeWidth={2.5} className="text-red shrink-0" aria-label="Kechikkan" />
                      )}
                    </button>
                    <div className="relative h-full shrink-0" style={{ width: totalWidth }}>
                      {bar.segments.map((segment, si) => {
                        const { startIdx, endIdx } = cellRanges[si];
                        const startCell = weekCells[startIdx];
                        const endCell = weekCells[endIdx];
                        if (!startCell || !endCell) return null;
                        const segOffsetPx = startCell.offsetPx;
                        const segWidthPx = endCell.offsetPx + endCell.widthPx - startCell.offsetPx;
                        const isLast = si === bar.segments.length - 1;
                        const overdueRing = isLast && bar.overdue ? "ring-inset ring-2 ring-ink/80" : "";

                        return (
                          <div
                            key={si}
                            className={`absolute inset-y-0 cursor-pointer ${STAGE_BAR_COLOR[segment.stage] ?? "bg-ink/30"} ${overdueRing}`}
                            style={{ left: segOffsetPx, width: segWidthPx }}
                            onMouseEnter={() => setActiveTooltip(bar.id)}
                            onMouseLeave={() => setActiveTooltip(null)}
                            onClick={openDetail}
                          />
                        );
                      })}
                      {activeTooltip === bar.id && (
                        <div
                          className="absolute -top-2 -translate-y-full z-30 rounded-xl bg-primary px-3 py-2 text-xs text-white shadow-lg whitespace-nowrap"
                          style={{ left: differenceInCalendarDays(bar.overallStart, rangeStart) * DAY_PX }}
                        >
                          <div className="font-semibold">{bar.modelName}</div>
                          <div className="text-white/70">{bar.stageLabel}</div>
                          <div className="text-white/70">
                            {bar.deadline ? `Muddat: ${bar.deadlineDate!.toLocaleDateString("uz-UZ")}` : "Muddat belgilanmagan"}
                          </div>
                          {bar.overdue && <div className="text-red font-medium">Kechikkan</div>}
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

      <ModelDetailModal detail={selectedDetail} onClose={() => setSelectedDetail(null)} />
    </div>
  );
}
