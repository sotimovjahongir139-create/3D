import { Wrench, Package, Layers, PackageCheck, CheckCircle2, type LucideIcon } from "lucide-react";

export const STAGE_META: Record<string, { label: string; tone: "yellow" | "orange" | "blue" | "teal" | "green"; icon: LucideIcon }> = {
  stage_umarxon: { label: "Umarxon", tone: "yellow", icon: Wrench },
  stage_3d: { label: "3D", tone: "orange", icon: Package },
  stage_mold: { label: "Qolip", tone: "blue", icon: Layers },
  stage_tayorlash: { label: "Sotuvga tayorlash", tone: "teal", icon: PackageCheck },
  stage_sales: { label: "Sotuv", tone: "green", icon: CheckCircle2 },
};
