import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api";
import { fetchRnpSheetValues } from "@/lib/googleSheets";
import { parseRnpData } from "@/lib/parseRnpData";

// Always hit Google Sheets fresh - no route-level or fetch-level caching.
// The client polls this on an interval and via a manual refresh button, and
// both need to see newly-added sheet rows/sections immediately, not a stale
// cached response.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET() {
  const { error } = await requireRole(["admin"]);
  if (error) return error;

  try {
    const rawRows = await fetchRnpSheetValues();
    const data = parseRnpData(rawRows);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[rnp] failed to fetch/parse RNP sheet:", err);
    return NextResponse.json({ error: "RNP ma'lumotlarini olishda xatolik yuz berdi" }, { status: 502 });
  }
}
