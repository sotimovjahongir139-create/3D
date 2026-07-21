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
const BACK_MONTHS = 1;
const FORWARD_MONTHS = 3;

export function GanttChart({ items }: GanttChartProps) {
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<ModelDetail | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => startOfDay(new Date()), []);

  const bars = useMemo(() => {
    // Multiple ProductionItem records can share the same model name (separate
    // batches of the same physical model tracked through the stages at
    // different times). The Gantt merges every item with an identical model
    // name into one row, combining all of their segments - one row per model
    // name, not one row per database record.
    const groups = new Map<string, GanttItem[]>();
    items.forEach((item) => {
      const key = item.model.name;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });

    return Array.from(groups.entries()).map(([name, groupItems]) => {
      const segments: Segment[] = [];

      groupItems.forEach((item) => {
        [...item.logs]
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
          .forEach((log) => {
            segments.push({
              stage: log.stage,
              start: startOfDay(parseISO(log.startDate)),
              end: startOfDay(parseISO(log.endDate)),
            });
          });

        const explicitStart = item.stageStart ? startOfDay(parseISO(item.stageStart)) : null;
        const itemDeadline = item.deadline ? startOfDay(parseISO(item.deadline)) : null;
        // Bars are a static planned schedule, computed once from the data, never
        // recalculated against today. With both dates known, the bar spans start
        // -> due exactly. With only ONE date known (no start yet, or a deadline
        // that hasn't been set again after a stage transition), there is no
        // second point to draw a real span between - fabricating one (e.g. a
        // guessed multi-week window) would stretch the bar with a width that
        // doesn't correspond to any real date, which is the bug. Pin it to a
        // single-point marker at whichever one date is actually known instead.
        if (explicitStart && itemDeadline) {
          const end = itemDeadline > explicitStart ? itemDeadline : addDays(explicitStart, 1);
          segments.push({ stage: item.currentStage, start: explicitStart, end });
        } else if (explicitStart || itemDeadline) {
          const onlyDate = (explicitStart ?? itemDeadline)!;
          segments.push({ stage: item.currentStage, start: onlyDate, end: onlyDate });
        }
      });

      // Segments must read left-to-right in the order the model actually
      // moved through them, regardless of which underlying item they came
      // from or the order items were returned in.
      segments.sort((a, b) => a.start.getTime() - b.start.getTime());

      // The item whose own timeline starts latest represents the model's
      // current, most-relevant state - it drives the sticky column's overdue
      // icon, the tooltip, and what the detail modal shows on click.
      const itemSortKey = (item: GanttItem) => {
        const d = item.stageStart ?? item.deadline;
        return d ? parseISO(d).getTime() : 0;
      };
      const primary = groupItems.reduce((latest, item) => (itemSortKey(item) > itemSortKey(latest) ? item : latest));

      const deadline = primary.deadline ? startOfDay(parseISO(primary.deadline)) : null;
      const overdue = deadline ? today > deadline : false;

      return {
        id: name,
        modelName: name,
        modelCategory: primary.model.category,
        modelImageUrl: primary.model.imageUrl,
        currentStage: primary.currentStage,
        stageStart: primary.stageStart,
        stageLabel: STAGE_LABELS[primary.currentStage] ?? primary.currentStage,
        deadline: primary.deadline,
        deadlineDate: deadline,
        overdue,
        segments,
        overallStart: segments[0]?.start ?? today,
      };
    });
  }, [items, today]);

  // Sotuv-stage models always float to the top, above everything still in
  // 3D/Qolip; sort is stable so relative order otherwise is unaffected. This
  // re-runs on every render, so a model moving into Sotuv jumps up on the
  // very next render with no manual re-sort needed.
  const sortedBars = useMemo(() => {
    return [...bars].sort((a, b) => {
      const aSales = a.currentStage === "stage_sales" ? 0 : 1;
      const bSales = b.currentStage === "stage_sales" ? 0 : 1;
      return aSales - bSales;
    });
  }, [bars]);

  const defaultRangeStart = useMemo(() => startOfMonth(subMonths(today, BACK_MONTHS)), [today]);
  const defaultRangeEnd = useMemo(() => endOfMonth(addMonths(today, FORWARD_MONTHS)), [today]);

  const rangeStart = useMemo(() => {
    if (!showFullHistory) return defaultRangeStart;
    const earliestStart = bars.length ? minDate(bars.map((b) => b.overallStart)) : defaultRangeStart;
    return startOfMonth(minDate([earliestStart, defaultRangeStart]));
  }, [showFullHistory, bars, defaultRangeStart]);

  const rangeEnd = useMemo(() => {
    // Must cover every segment's own end date, not just the primary item's
    // deadline - a model with only a start date (no deadline) still has a
    // real date that needs to be on the grid. Missing it here would silently
    // clamp cellIndexForDate to the last visible cell instead of the correct
    // one, which is exactly the kind of "wrong week" bug this guards against.
    const segmentEnds = bars.flatMap((b) => b.segments.map((s) => s.end));
    const furthest = segmentEnds.length ? maxDate(segmentEnds) : defaultRangeEnd;
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
              {sortedBars.map((bar) => {
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
                // cell, both inclusive). Segments are chronologically sorted,
                // but their cell ranges can still collide - either sharing a
                // boundary date, or (for merged rows combining multiple items)
                // genuinely starting in the same week. Either way, push each
                // segment to start right after the previous one ends, so they
                // always sit in strict left-to-right sequence with no overlap.
                const cellRanges = bar.segments.map((segment) => ({
                  startIdx: cellIndexForDate(segment.start),
                  endIdx: cellIndexForDate(segment.end),
                }));
                for (let i = 1; i < cellRanges.length; i++) {
                  if (cellRanges[i].startIdx <= cellRanges[i - 1].endIdx) {
                    cellRanges[i].startIdx = cellRanges[i - 1].endIdx + 1;
                    if (cellRanges[i].endIdx < cellRanges[i].startIdx) {
                      cellRanges[i].endIdx = cellRanges[i].startIdx;
                    }
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
