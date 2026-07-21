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
 * It is recomputed from that week's fact vs the fact of the week right
 * before it, per the rules in computeRatio() below. This dashboard shows
 * the current week plus the 2 weeks before it (3 columns total); a 4th,
 * older week is fetched silently just to give the oldest shown week a
 * baseline to compare against.
 */

const DATE_RANGE_RE = /(\d{2})\.(\d{2})\.(\d{4})\s*-\s*(\d{2})\.(\d{2})\.(\d{4})/;
const WEEK_BLOCK_WIDTH = 3; // Reja | Fakt | Nisbat
const WEEKS_SHOWN = 3;

export type Trend = "up" | "down" | "flat" | "zero" | "new" | "pending";

export type RnpRatio = {
  percent: number | null; // null when trend is "new" (division by zero) or "pending" (not entered yet)
  trend: Trend;
};

export type RnpWeekColumn = {
  label: string;
  reja: number | null;
  fakt: number | null;
  ratio: RnpRatio;
};

export type RnpMetricRow = {
  metric: string;
  weeks: RnpWeekColumn[]; // oldest -> newest, up to WEEKS_SHOWN entries
};

export type RnpSectionData = {
  section: string;
  metrics: RnpMetricRow[];
};

export type RnpParsedData = {
  weekLabels: string[]; // oldest -> newest, matches RnpMetricRow.weeks order
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

/**
 * Picks the window of weeks to show: the current week (by date, or the sheet's
 * last block if today isn't in any of them yet) plus the WEEKS_SHOWN-1 weeks
 * before it. Returns { window, baseline } where window is oldest -> newest
 * (what's displayed) and baseline is the block right before window[0], used
 * only to compute window[0]'s ratio (never displayed itself).
 */
function pickWeekWindow(blocks: WeekBlock[], now: Date): { window: WeekBlock[]; baseline: WeekBlock | null } {
  if (blocks.length === 0) return { window: [], baseline: null };

  let currentIndex = blocks.findIndex((b) => now >= b.start && now <= b.end);
  if (currentIndex === -1) currentIndex = blocks.length - 1;

  const startIndex = Math.max(0, currentIndex - (WEEKS_SHOWN - 1));
  const window = blocks.slice(startIndex, currentIndex + 1);
  const baseline = startIndex > 0 ? blocks[startIndex - 1] : null;

  return { window, baseline };
}

/**
 * ratio_percent = ((currentFact - previousFact) / previousFact) * 100
 *
 * Special cases:
 * - currentFact === null (cell genuinely empty) -> "pending" trend (gray, no arrow,
 *   shown as "—"). The current week is usually still in progress, so an empty Fakt
 *   cell means "not entered yet", NOT "dropped to zero" — must not be scored as -100%.
 * - previousFact == 0 && currentFact == 0 -> 0%, "zero" trend (gray, no arrow)
 * - previousFact == 0 && currentFact > 0  -> "new" trend (green, up arrow, shown as "Yangi")
 * - result > 0  -> "up" (green, up arrow)
 * - result < 0  -> "down" (red, down arrow)
 * - result == 0 -> "flat" (gray, flat arrow)
 *
 * The result is NOT clamped to +/-100% — a metric that more than doubled (or
 * more than halved) week over week legitimately produces a number outside that
 * range, and clamping it would just make the displayed number wrong.
 */
export function computeRatio(previousFact: number | null, currentFact: number | null): RnpRatio {
  if (currentFact === null) return { percent: null, trend: "pending" };

  const prev = previousFact ?? 0;
  const curr = currentFact;

  if (prev === 0 && curr === 0) return { percent: 0, trend: "zero" };
  if (prev === 0 && curr > 0) return { percent: null, trend: "new" };

  const percent = Math.round(((curr - prev) / prev) * 100);
  if (percent > 0) return { percent, trend: "up" };
  if (percent < 0) return { percent, trend: "down" };
  return { percent: 0, trend: "flat" };
}

/** Parses the raw RNP tab values into department sections, current week + 2 prior weeks. */
export function parseRnpData(rawRows: unknown[][], now: Date = new Date()): RnpParsedData {
  if (!rawRows || rawRows.length === 0) {
    return { weekLabels: [], sections: [] };
  }

  const headerRowIndex = findHeaderRowIndex(rawRows);
  if (headerRowIndex === -1) {
    return { weekLabels: [], sections: [] };
  }

  const weekBlocks = findWeekBlocks(rawRows[headerRowIndex]);
  const { window, baseline } = pickWeekWindow(weekBlocks, now);

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

    const weeks: RnpWeekColumn[] = window.map((block, i) => {
      const priorBlock = i === 0 ? baseline : window[i - 1];
      const reja = cellToNumber(row[block.colIndex]);
      const fakt = cellToNumber(row[block.colIndex + 1]);
      const priorFakt = priorBlock ? cellToNumber(row[priorBlock.colIndex + 1]) : null;
      return { label: block.label, reja, fakt, ratio: computeRatio(priorFakt, fakt) };
    });

    const metricRow: RnpMetricRow = { metric: metricCell, weeks };

    if (!sectionsMap.has(lastSectionName)) {
      sectionsMap.set(lastSectionName, { section: lastSectionName, metrics: [] });
    }
    sectionsMap.get(lastSectionName)!.metrics.push(metricRow);
  }

  return {
    weekLabels: window.map((b) => b.label),
    sections: Array.from(sectionsMap.values()),
  };
}

// exported for potential reuse/testing of block width assumption
export const RNP_WEEK_BLOCK_WIDTH = WEEK_BLOCK_WIDTH;
