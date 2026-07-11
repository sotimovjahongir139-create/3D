import { Package, Layers, CheckCircle2, type LucideIcon } from "lucide-react";

export const STAGE_META: Record<string, { label: string; tone: "orange" | "blue" | "green"; icon: LucideIcon }> = {
  stage_3d: { label: "3D", tone: "orange", icon: Package },
  stage_mold: { label: "Qolip", tone: "blue", icon: Layers },
  stage_sales: { label: "Sotuv", tone: "green", icon: CheckCircle2 },
};
