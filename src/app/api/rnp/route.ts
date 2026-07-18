import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api";
import { fetchRnpSheetValues } from "@/lib/googleSheets";
import { parseRnpData } from "@/lib/parseRnpData";

// Cache for 60 seconds (ISR-style revalidation for this route segment).
export const revalidate = 60;

export async function GET() {
  const { error } = await requireRole(["admin"]);
  if (error) return error;

  try {
    const rawRows = await fetchRnpSheetValues();
    const data = parseRnpData(rawRows);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[rnp] failed to fetch/parse RNP sheet:", err);
    return NextResponse.json({ error: "RNP ma'lumotlarini olishda xatolik yuz berdi" }, { status: 502 });
  }
}
