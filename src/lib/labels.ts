export const STAGE_LABELS: Record<string, string> = {
  stage_umarxon: "Umarxon",
  stage_3d: "3D",
  stage_mold: "Qolip",
  stage_tayorlash: "Sotuvga tayorlash",
  stage_sales: "Sotuv",
};

export const STAGE_ORDER = ["stage_umarxon", "stage_3d", "stage_mold", "stage_tayorlash", "stage_sales"] as const;

export const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  dept_3d: "3D bo'limi",
  dept_mold: "Qolip bo'limi",
  dept_sales: "Sotuv bo'limi",
};

export const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  sent: "Yuborildi",
  won: "Kelishildi",
  lost: "Rad etildi",
};

export function nextStage(stage: string): string | null {
  const idx = STAGE_ORDER.indexOf(stage as (typeof STAGE_ORDER)[number]);
  if (idx === -1 || idx === STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

export function itemStatus(deadline: Date | null, currentStage: string): {
  label: string;
  tone: "overdue" | "progress" | "done";
} {
  if (currentStage === "stage_sales") {
    return { label: "Tayyor", tone: "done" };
  }
  if (deadline && new Date(deadline).getTime() < Date.now()) {
    return { label: "Kechikdi", tone: "overdue" };
  }
  return { label: "Jarayonda", tone: "progress" };
}
