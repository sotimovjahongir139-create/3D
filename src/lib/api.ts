import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

export async function requireRole(roles: string[]) {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 }) };
  }
  if (!roles.includes(user.role)) {
    return { user: null, error: NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 }) };
  }
  return { user, error: null };
}

export const STAGE_MAP: Record<string, string> = {
  "3d": "stage_3d",
  mold: "stage_mold",
  sales: "stage_sales",
};
