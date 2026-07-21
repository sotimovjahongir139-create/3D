"use client";

import { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { X, Image as ImageIcon } from "lucide-react";
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

function ModelDetailPhoto({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-56 w-full items-center justify-center rounded-t-3xl bg-bg text-ink/30">
        <ImageIcon size={40} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className="relative h-56 w-full overflow-hidden rounded-t-3xl">
      <Image src={src} alt={alt} fill sizes="384px" className="object-cover" onError={() => setFailed(true)} />
    </div>
  );
}

export function ModelDetailModal({ detail, onClose }: { detail: ModelDetail | null; onClose: () => void }) {
  if (!detail) return null;

  const status = itemStatus(detail.deadline ? new Date(detail.deadline) : null, detail.currentStage);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 px-4" onClick={onClose}>
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Yopish"
          className="absolute right-4 top-4 z-10 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60"
        >
          <X size={16} />
        </button>

        <ModelDetailPhoto src={detail.imageUrl} alt={detail.name} />

        <div className="p-6">
          <div className="mb-5 text-center">
            <h3 className="font-display text-lg font-bold text-ink leading-tight">{detail.name}</h3>
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
    </div>
  );
}
