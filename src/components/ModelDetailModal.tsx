"use client";

import { format } from "date-fns";
import { X } from "lucide-react";
import { ModelThumb } from "@/components/ModelThumb";
import { StageBadge } from "@/components/StageBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { itemStatus } from "@/lib/labels";

export type ModelDetail = {
  name: string;
  category: string | null;
  imageUrl: string | null;
  currentStage: string;
  stageStart: string;
  deadline: string | null;
};

export function ModelDetailModal({ detail, onClose }: { detail: ModelDetail | null; onClose: () => void }) {
  if (!detail) return null;

  const status = itemStatus(detail.deadline ? new Date(detail.deadline) : null, detail.currentStage);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 px-4" onClick={onClose}>
      <div
        className="relative w-full max-w-sm rounded-3xl bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Yopish"
          className="absolute right-4 top-4 rounded-full p-1.5 text-ink/40 hover:bg-bg hover:text-ink"
        >
          <X size={16} />
        </button>

        <div className="mb-5 flex flex-col items-center text-center">
          <ModelThumb src={detail.imageUrl} alt={detail.name} size={88} rounded="lg" />
          <h3 className="mt-3 font-display text-lg font-bold text-ink leading-tight">{detail.name}</h3>
          {detail.category && <div className="mt-0.5 text-xs text-ink/40">{detail.category}</div>}
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-ink/50">Bosqich</span>
            <StageBadge stage={detail.currentStage} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink/50">Holat</span>
            <StatusBadge label={status.label} tone={status.tone} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink/50">Boshlangan sana</span>
            <span className="text-ink font-medium">{format(new Date(detail.stageStart), "dd.MM.yyyy")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink/50">Muddat</span>
            <span className="text-ink font-medium">
              {detail.deadline ? format(new Date(detail.deadline), "dd.MM.yyyy") : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
