/**
 * Parser for the "RNP" Google Sheet tab.
 *
 * Source sheet layout (as of the 2026 RNP tab):
 *
 *   Column A: Department/section name (e.g. "Marketing", "Sotuv bo'lim",
 *             "Sotuv menejeri", "Klient menejer"). This is a merged cell
 *             spanning multiple metric rows — Google Sheets only returns a
 *             value in the merge's top-left cell, so we carry the last
 *             non-empty value forward down the rows it covers.
 *   Column B: Metric name (e.g. "Yangi SKU soni").
 *   Columns C, D, E: current-month totals — "Reja | Fakt | Nisbat".
 *   Columns F+ : repeating blocks of 3 columns, one block per week.
 *             Each block's header cell (in the header row) holds a date
 *             range like "29.06.2026 - 05.07.2026", and the row below it
 *             holds the sub-headers "Reja | Fakt | Nisbat" for that block.
 *
 * The number of weekly blocks grows every week, so nothing here hardcodes
 * a column count — every week block is located by scanning the header row
 * for "DD.MM.YYYY - DD.MM.YYYY" patterns.
 *
 * The "Nisbat" (%) shown by this dashboard is NOT read from the sheet.
 * It is recomputed from current-week fact vs previous-week fact per the
 * rules in computeRatio() below.
 */

const DATE_RANGE_RE = /(\d{2})\.(\d{2})\.(\d{4})\s*-\s*(\d{2})\.(\d{2})\.(\d{4})/;
const WEEK_BLOCK_WIDTH = 3; // Reja | Fakt | Nisbat

export type Trend = "up" | "down" | "flat" | "zero" | "new";

export type RnpRatio = {
  percent: number | null; // null when trend === "new" (division by zero, undefined %)
  trend: Trend;
};

export type RnpMetricRow = {
  metric: string;
  currentReja: number | null;
  currentFakt: number | null;
  previousFakt: number | null;
  ratio: RnpRatio;
};

export type RnpSectionData = {
  section: string;
  metrics: RnpMetricRow[];
};

export type RnpParsedData = {
  currentWeekLabel: string | null;
  previousWeekLabel: string | null;
  sections: RnpSectionData[];
};

type WeekBlock = {
  label: string;
  start: Date;
  end: Date;
  colIndex: number; // column index of this block's "Reja" sub-column
};

function cellToString(cell: unknown): string {
  if (cell === null || cell === undefined) return "";
  return String(cell).trim();
}

function cellToNumber(cell: unknown): number | null {
  if (cell === null || cell === undefined || cell === "") return null;
  if (typeof cell === "number") return cell;
  const cleaned = String(cell).replace(/[,\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseDateRangeCell(raw: string): { start: Date; end: Date } | null {
  const match = raw.match(DATE_RANGE_RE);
  if (!match) return null;
  const [, d1, m1, y1, d2, m2, y2] = match;
  const start = new Date(Number(y1), Number(m1) - 1, Number(d1));
  const end = new Date(Number(y2), Number(m2) - 1, Number(d2), 23, 59, 59, 999);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return { start, end };
}

/** Finds the header row (the one containing date-range labels) and returns its index, or -1. */
function findHeaderRowIndex(rows: unknown[][]): number {
  let bestIndex = -1;
  let bestCount = 0;
  const scanLimit = Math.min(rows.length, 10);
  for (let r = 0; r < scanLimit; r++) {
    const count = rows[r]?.filter((c) => DATE_RANGE_RE.test(cellToString(c))).length ?? 0;
    if (count > bestCount) {
      bestCount = count;
      bestIndex = r;
    }
  }
  return bestCount > 0 ? bestIndex : -1;
}

function findWeekBlocks(headerRow: unknown[]): WeekBlock[] {
  const blocks: WeekBlock[] = [];
  for (let col = 0; col < headerRow.length; col++) {
    const raw = cellToString(headerRow[col]);
    const range = parseDateRangeCell(raw);
    if (range) {
      blocks.push({ label: raw, start: range.start, end: range.end, colIndex: col });
    }
  }
  return blocks;
}

function pickCurrentAndPreviousWeek(blocks: WeekBlock[], now: Date): { current: WeekBlock | null; previous: WeekBlock | null } {
  if (blocks.length === 0) return { current: null, previous: null };

  const matchIndex = blocks.findIndex((b) => now >= b.start && now <= b.end);
  if (matchIndex !== -1) {
    return {
      current: blocks[matchIndex],
      previous: matchIndex > 0 ? blocks[matchIndex - 1] : null,
    };
  }

  // Fallback: sheet hasn't been updated with this week's block yet — use the last one.
  const last = blocks[blocks.length - 1];
  const secondToLast = blocks.length > 1 ? blocks[blocks.length - 2] : null;
  return { current: last, previous: secondToLast };
}

/**
 * ratio_percent = ((currentFact - previousFact) / previousFact) * 100
 *
 * Special cases:
 * - previousFact == 0 && currentFact == 0 -> 0%, "zero" trend (gray, no arrow)
 * - previousFact == 0 && currentFact > 0  -> "new" trend (green, up arrow, shown as "Yangi")
 * - result > 0  -> "up" (green, up arrow)
 * - result < 0  -> "down" (red, down arrow)
 * - result == 0 -> "flat" (gray, flat arrow)
 */
export function computeRatio(previousFact: number | null, currentFact: number | null): RnpRatio {
  const prev = previousFact ?? 0;
  const curr = currentFact ?? 0;

  if (prev === 0 && curr === 0) return { percent: 0, trend: "zero" };
  if (prev === 0 && curr > 0) return { percent: null, trend: "new" };

  const percent = Math.round(((curr - prev) / prev) * 100);
  if (percent > 0) return { percent, trend: "up" };
  if (percent < 0) return { percent, trend: "down" };
  return { percent: 0, trend: "flat" };
}

/** Parses the raw RNP tab values into department sections with recomputed weekly ratios. */
export function parseRnpData(rawRows: unknown[][], now: Date = new Date()): RnpParsedData {
  if (!rawRows || rawRows.length === 0) {
    return { currentWeekLabel: null, previousWeekLabel: null, sections: [] };
  }

  const headerRowIndex = findHeaderRowIndex(rawRows);
  if (headerRowIndex === -1) {
    return { currentWeekLabel: null, previousWeekLabel: null, sections: [] };
  }

  const weekBlocks = findWeekBlocks(rawRows[headerRowIndex]);
  const { current, previous } = pickCurrentAndPreviousWeek(weekBlocks, now);

  const dataStartRow = headerRowIndex + 2; // header row + Reja/Fakt/Nisbat sub-header row
  const sectionsMap = new Map<string, RnpSectionData>();
  let lastSectionName = "";

  for (let r = dataStartRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const sectionCell = cellToString(row[0]);
    const metricCell = cellToString(row[1]);
    if (sectionCell) lastSectionName = sectionCell;
    if (!lastSectionName || !metricCell) continue;

    const currentReja = current ? cellToNumber(row[current.colIndex]) : null;
    const currentFakt = current ? cellToNumber(row[current.colIndex + 1]) : null;
    const previousFakt = previous ? cellToNumber(row[previous.colIndex + 1]) : null;

    const metricRow: RnpMetricRow = {
      metric: metricCell,
      currentReja,
      currentFakt,
      previousFakt,
      ratio: computeRatio(previousFakt, currentFakt),
    };

    if (!sectionsMap.has(lastSectionName)) {
      sectionsMap.set(lastSectionName, { section: lastSectionName, metrics: [] });
    }
    sectionsMap.get(lastSectionName)!.metrics.push(metricRow);
  }

  return {
    currentWeekLabel: current?.label ?? null,
    previousWeekLabel: previous?.label ?? null,
    sections: Array.from(sectionsMap.values()),
  };
}

// exported for potential reuse/testing of block width assumption
export const RNP_WEEK_BLOCK_WIDTH = WEEK_BLOCK_WIDTH;
