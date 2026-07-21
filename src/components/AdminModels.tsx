"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { format } from "date-fns";
import { Pencil, Trash2, ImagePlus, X } from "lucide-react";
import { StageBadge } from "@/components/StageBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { TableCard } from "@/components/TableCard";
import { PageHeader } from "@/components/PageHeader";
import { ModelThumb } from "@/components/ModelThumb";
import { ModelDetailModal, type ModelDetail } from "@/components/ModelDetailModal";
import { itemStatus } from "@/lib/labels";

type ModelItem = {
  id: string;
  currentStage: string;
  stageStart: string | null;
  deadline: string | null;
};

type ModelRow = {
  id: string;
  name: string;
  category: string | null;
  imageUrl: string | null;
  items: ModelItem[];
};

const SORT_OPTIONS = [
  { value: "name_asc", label: "Nomi bo'yicha" },
  { value: "stage", label: "Bosqich bo'yicha" },
];

const STAGE_OPTIONS = [
  { value: "3d", label: "3D" },
  { value: "mold", label: "Qolip" },
  { value: "sales", label: "Sotuv" },
];

function today() {
  return format(new Date(), "yyyy-MM-dd");
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
const HEIC_EXT_RE = /\.(heic|heif)$/i;
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // mobile camera originals run larger than desktop exports

function isAcceptableImage(file: File): boolean {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) return true;
  // Some mobile browsers send an empty/generic MIME type for HEIC files.
  if (!file.type || file.type === "application/octet-stream") return HEIC_EXT_RE.test(file.name);
  return false;
}

function isHeic(file: File): boolean {
  return file.type === "image/heic" || file.type === "image/heif" || HEIC_EXT_RE.test(file.name);
}

export function AdminModels() {
  const [models, setModels] = useState<ModelRow[]>([]);
  const [name, setName] = useState("");
  const [stage, setStage] = useState("3d");
  const [stageStart, setStageStart] = useState(today());
  const [deadline, setDeadline] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(SORT_OPTIONS[0].value);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editDeadlineValue, setEditDeadlineValue] = useState("");
  const [deletingModel, setDeletingModel] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<ModelDetail | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/models");
    const data = await res.json();
    setModels(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageError(null);
    setFormError(null);
    if (file) {
      console.log(`[upload] file selected: name=${file.name} type=${file.type || "(bo'sh)"} size=${file.size}`);
      if (!isAcceptableImage(file)) {
        const message = `Rasm qabul qilinmadi: "${file.name}" fayl turi (${file.type || "noma'lum"}) qo'llab-quvvatlanmaydi. Faqat JPG, PNG, WEBP, GIF yoki HEIC fayllar qabul qilinadi — model rasmsiz saqlanadi.`;
        console.error(`[upload] client rejected file: unsupported type "${file.type}"`);
        setImageError("Faqat JPG, PNG, WEBP, GIF yoki HEIC fayllar qabul qilinadi");
        setFormError(message);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setImageFile(null);
        setImagePreview(null);
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        const message = `Rasm qabul qilinmadi: "${file.name}" fayl hajmi 20MB dan oshib ketdi — model rasmsiz saqlanadi.`;
        console.error(`[upload] client rejected file: too large (${file.size} bytes)`);
        setImageError("Fayl hajmi 20MB dan oshmasligi kerak");
        setFormError(message);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setImageFile(null);
        setImagePreview(null);
        return;
      }
      // HEIC can't be decoded by <img> in any browser but Safari - the
      // server converts it on upload, but a local blob-URL preview here
      // would just render broken. Skip the preview for HEIC specifically.
      setImageFile(file);
      setImagePreview(isHeic(file) ? null : URL.createObjectURL(file));
      return;
    }
    setImageFile(null);
    setImagePreview(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    if (imageError) {
      console.error("[upload] blocked submit: unresolved image rejection still pending");
      setFormError(`Rasm hali saqlanmadi (${imageError}). Boshqa rasm tanlang yoki rasmsiz davom eting.`);
      return;
    }
    setFormError(null);
    setSubmitting(true);

    let imageUrl: string | null = null;
    if (imageFile) {
      console.log(`[upload] uploading ${imageFile.name} (${imageFile.size} bytes)...`);
      const formData = new FormData();
      formData.append("file", imageFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData }).catch((err) => {
        console.error("[upload] network error during upload request:", err);
        return null;
      });
      if (!uploadRes || !uploadRes.ok) {
        const body = uploadRes ? await uploadRes.json().catch(() => null) : null;
        console.error(`[upload] upload failed: status=${uploadRes?.status} body=`, body);
        setFormError(body?.error || "Rasmni yuklashda xatolik yuz berdi");
        setSubmitting(false);
        return;
      }
      const uploadData = await uploadRes.json();
      imageUrl = uploadData.url;
      console.log(`[upload] upload succeeded, url=${imageUrl}`);
    }

    const createRes = await fetch("/api/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        stage,
        stageStart,
        deadline: deadline || null,
        imageUrl,
      }),
    }).catch((err) => {
      console.error("[upload] network error during model create request:", err);
      return null;
    });

    if (!createRes || !createRes.ok) {
      const body = createRes ? await createRes.json().catch(() => null) : null;
      console.error(`[upload] model create failed: status=${createRes?.status} body=`, body);
      setFormError(body?.error || "Modelni saqlashda xatolik yuz berdi");
      setSubmitting(false);
      return;
    }
    console.log(`[upload] model created successfully with imageUrl=${imageUrl}`);

    setName("");
    setStage("3d");
    setStageStart(today());
    setDeadline("");
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSubmitting(false);
    load();
  }

  async function handleDeadlineSave() {
    if (!editingItemId || !editDeadlineValue) return;
    await fetch(`/api/items/${editingItemId}/deadline`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deadline: editDeadlineValue }),
    });
    setEditingItemId(null);
    setEditDeadlineValue("");
    load();
  }

  async function handleDeleteConfirm() {
    if (!deletingModel) return;
    setDeleting(true);
    await fetch(`/api/models/${deletingModel.id}`, { method: "DELETE" });
    setDeleting(false);
    setDeletingModel(null);
    load();
  }

  const rows = useMemo(() => models.flatMap((model) => model.items.map((item) => ({ model, item }))), [models]);

  const visibleRows = useMemo(() => {
    let list = rows.filter((r) => r.model.name.toLowerCase().includes(search.toLowerCase()));
    list = [...list].sort((a, b) => {
      if (sort === "stage") return a.item.currentStage.localeCompare(b.item.currentStage);
      return a.model.name.localeCompare(b.model.name);
    });
    return list;
  }, [rows, search, sort]);

  return (
    <div className="space-y-8">
      <PageHeader title="Admin — modellar" subtitle="Yangi model qo'shish va muddatlarni belgilash" />

      <form
        onSubmit={handleCreate}
        className="bg-card rounded-3xl shadow-sm p-5 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end"
      >
        {formError && (
          <div className="sm:col-span-6 rounded-xl bg-red/10 px-3 py-2 text-xs font-medium text-red">{formError}</div>
        )}
        <div className="sm:col-span-1">
          <label className="block text-xs font-medium text-ink/60 mb-1.5">Rasm</label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-dashed border-ink/20 bg-bg text-ink/40 hover:border-primary hover:text-primary"
          >
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="" className="h-full w-full object-cover" />
            ) : imageFile ? (
              <span className="text-[10px] font-semibold text-primary">HEIC</span>
            ) : (
              <ImagePlus size={18} strokeWidth={1.75} />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
            onChange={handleFileChange}
            className="hidden"
          />
          {imageError && (
            <div className="mt-1">
              <p className="text-[11px] font-medium text-red">{imageError}</p>
              <button
                type="button"
                onClick={() => {
                  setImageError(null);
                  setFormError(null);
                }}
                className="text-[11px] font-medium text-ink/50 underline hover:text-ink"
              >
                Rasmsiz davom etish
              </button>
            </div>
          )}
        </div>
        <div className="sm:col-span-1">
          <label className="block text-xs font-medium text-ink/60 mb-1.5">Model nomi</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-ink/10 bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-xs font-medium text-ink/60 mb-1.5">Bosqich</label>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="w-full rounded-xl border border-ink/10 bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            {STAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-1">
          <label className="block text-xs font-medium text-ink/60 mb-1.5">Bosqichga tushgan sana</label>
          <input
            type="date"
            value={stageStart}
            onChange={(e) => setStageStart(e.target.value)}
            className="w-full rounded-xl border border-ink/10 bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-xs font-medium text-ink/60 mb-1.5">Muddat</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full rounded-xl border border-ink/10 bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div className="sm:col-span-1">
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? "Yuklanmoqda..." : "Qo'shish"}
          </button>
        </div>
      </form>

      <TableCard
        title="Modellar"
        count={visibleRows.length}
        search={search}
        onSearchChange={setSearch}
        sortValue={sort}
        onSortChange={setSort}
        sortOptions={SORT_OPTIONS}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/5 text-left text-xs uppercase tracking-wide text-ink/40">
              <th className="px-5 py-3 font-medium">Model</th>
              <th className="px-5 py-3 font-medium">Bosqich</th>
              <th className="px-5 py-3 font-medium">Boshlangan sana</th>
              <th className="px-5 py-3 font-medium">Muddat</th>
              <th className="px-5 py-3 font-medium">Holat</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(({ model, item }) => {
              const status = itemStatus(item.deadline ? new Date(item.deadline) : null, item.currentStage);
              return (
                <tr key={item.id} className="border-b border-ink/5 last:border-0 h-[60px]">
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedDetail({
                          name: model.name,
                          category: model.category,
                          imageUrl: model.imageUrl,
                          currentStage: item.currentStage,
                          stageStart: item.stageStart,
                          deadline: item.deadline,
                        })
                      }
                      className="flex items-center gap-3 text-left hover:opacity-80"
                    >
                      <ModelThumb src={model.imageUrl} alt={model.name} size={44} rounded="lg" />
                      <div>
                        <div className="font-medium text-ink">{model.name}</div>
                        {model.category && <div className="text-xs text-ink/40">{model.category}</div>}
                      </div>
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <StageBadge stage={item.currentStage} />
                  </td>
                  <td className="px-5 py-3 text-ink/70">
                    {item.stageStart ? format(new Date(item.stageStart), "dd.MM.yyyy") : "—"}
                  </td>
                  <td className="px-5 py-3 text-ink/70">
                    {item.deadline ? format(new Date(item.deadline), "dd.MM.yyyy") : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge label={status.label} tone={status.tone} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditingItemId(item.id);
                          setEditDeadlineValue(item.deadline ? format(new Date(item.deadline), "yyyy-MM-dd") : "");
                        }}
                        aria-label="Muddatni tahrirlash"
                        title="Tahrirlash"
                        className="rounded-full p-2 text-ink/40 hover:bg-bg hover:text-primary"
                      >
                        <Pencil size={15} strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => setDeletingModel({ id: model.id, name: model.name })}
                        aria-label="O'chirish"
                        title="O'chirish"
                        className="rounded-full p-2 text-ink/40 hover:bg-red/10 hover:text-red"
                      >
                        <Trash2 size={15} strokeWidth={1.75} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-ink/40">
                  Modellar yo&apos;q
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableCard>

      {editingItemId && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/40 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display font-bold text-ink">Muddatni tahrirlash</h3>
              <button
                onClick={() => setEditingItemId(null)}
                aria-label="Yopish"
                className="rounded-full p-1.5 text-ink/40 hover:bg-bg hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
            <label className="block text-xs font-medium text-ink/60 mb-1.5">Yangi muddat</label>
            <input
              type="date"
              value={editDeadlineValue}
              onChange={(e) => setEditDeadlineValue(e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setEditingItemId(null)}
                className="rounded-full border border-ink/10 px-4 py-2 text-sm font-medium text-ink/70 hover:bg-bg"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleDeadlineSave}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingModel && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/40 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display font-bold text-ink">O&apos;chirish</h3>
              <button
                onClick={() => setDeletingModel(null)}
                aria-label="Yopish"
                className="rounded-full p-1.5 text-ink/40 hover:bg-bg hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-ink/70">
              <span className="font-medium text-ink">{deletingModel.name}</span> — bu modelni o&apos;chirmoqchimisiz?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeletingModel(null)}
                className="rounded-full border border-ink/10 px-4 py-2 text-sm font-medium text-ink/70 hover:bg-bg"
              >
                Yo&apos;q
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="rounded-full bg-red px-4 py-2 text-sm font-semibold text-white hover:bg-red/90 disabled:opacity-60"
              >
                {deleting ? "O'chirilmoqda..." : "Ha"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ModelDetailModal detail={selectedDetail} onClose={() => setSelectedDetail(null)} />
    </div>
  );
}
