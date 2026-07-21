"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { StatusBadge } from "@/components/StatusBadge";
import { TableCard } from "@/components/TableCard";
import { PageHeader } from "@/components/PageHeader";
import { ModelThumb } from "@/components/ModelThumb";
import { ModelDetailModal, type ModelDetail } from "@/components/ModelDetailModal";
import { PROPOSAL_STATUS_LABELS } from "@/lib/labels";

type Item = {
  id: string;
  sampleSent: boolean;
  currentStage: string;
  stageStart: string | null;
  deadline: string | null;
  model: { name: string; category: string | null; imageUrl: string | null };
};

type Proposal = {
  id: string;
  clientName: string;
  date: string;
  status: string;
  productionItem: { model: { name: string } };
};

const ITEM_SORT_OPTIONS = [
  { value: "name_asc", label: "Nomi bo'yicha" },
  { value: "status", label: "Holat bo'yicha" },
];

const PROPOSAL_SORT_OPTIONS = [
  { value: "date_desc", label: "Sana bo'yicha" },
  { value: "client_asc", label: "Mijoz bo'yicha" },
];

export function SalesBoard() {
  const [items, setItems] = useState<Item[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [clientName, setClientName] = useState("");
  const [productionItemId, setProductionItemId] = useState("");
  const [status, setStatus] = useState("sent");
  const [submitting, setSubmitting] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [itemSort, setItemSort] = useState(ITEM_SORT_OPTIONS[0].value);
  const [proposalSearch, setProposalSearch] = useState("");
  const [proposalSort, setProposalSort] = useState(PROPOSAL_SORT_OPTIONS[0].value);
  const [selectedDetail, setSelectedDetail] = useState<ModelDetail | null>(null);

  const load = useCallback(async () => {
    const [itemsRes, proposalsRes] = await Promise.all([
      fetch("/api/items?stage=sales"),
      fetch("/api/proposals"),
    ]);
    const itemsData = await itemsRes.json();
    const proposalsData = await proposalsRes.json();
    setItems(Array.isArray(itemsData) ? itemsData : []);
    setProposals(Array.isArray(proposalsData) ? proposalsData : []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleSample(id: string) {
    await fetch(`/api/items/${id}/sample`, { method: "POST" });
    load();
  }

  async function handleAddProposal(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName || !productionItemId) return;
    setSubmitting(true);
    await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientName, productionItemId, status }),
    });
    setClientName("");
    setProductionItemId("");
    setStatus("sent");
    setSubmitting(false);
    load();
  }

  const visibleItems = useMemo(() => {
    let rows = items.filter((i) => i.model.name.toLowerCase().includes(itemSearch.toLowerCase()));
    rows = [...rows].sort((a, b) => {
      if (itemSort === "status") return Number(a.sampleSent) - Number(b.sampleSent);
      return a.model.name.localeCompare(b.model.name);
    });
    return rows;
  }, [items, itemSearch, itemSort]);

  const visibleProposals = useMemo(() => {
    let rows = proposals.filter((p) => p.clientName.toLowerCase().includes(proposalSearch.toLowerCase()));
    rows = [...rows].sort((a, b) => {
      if (proposalSort === "client_asc") return a.clientName.localeCompare(b.clientName);
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    return rows;
  }, [proposals, proposalSearch, proposalSort]);

  return (
    <div className="space-y-8">
      <PageHeader title="Sotuv bo'limi" subtitle="Namunalar va mijoz takliflari" />

      <TableCard
        title="Sotuv bosqichidagi bandlar"
        count={visibleItems.length}
        search={itemSearch}
        onSearchChange={setItemSearch}
        sortValue={itemSort}
        onSortChange={setItemSort}
        sortOptions={ITEM_SORT_OPTIONS}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/5 text-left text-xs uppercase tracking-wide text-ink/40">
              <th className="px-5 py-3 font-medium">Model</th>
              <th className="px-5 py-3 font-medium">Holat</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => (
              <tr key={item.id} className="border-b border-ink/5 last:border-0 h-[56px]">
                <td className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedDetail({
                        name: item.model.name,
                        category: item.model.category,
                        imageUrl: item.model.imageUrl,
                        currentStage: item.currentStage,
                        stageStart: item.stageStart,
                        deadline: item.deadline,
                      })
                    }
                    className="flex items-center gap-3 text-left hover:opacity-80"
                  >
                    <ModelThumb src={item.model.imageUrl} alt={item.model.name} size={44} rounded="full" />
                    <div>
                      <div className="font-medium text-ink">{item.model.name}</div>
                      {item.model.category && <div className="text-xs text-ink/40">{item.model.category}</div>}
                    </div>
                  </button>
                </td>
                <td className="px-5 py-3">
                  {item.sampleSent ? (
                    <StatusBadge label="Namuna yuborilgan" tone="sample" />
                  ) : (
                    <StatusBadge label="Namuna kutilmoqda" tone="progress" />
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  {!item.sampleSent && (
                    <button
                      onClick={() => toggleSample(item.id)}
                      className="rounded-full bg-blue px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue/90"
                    >
                      Namuna yuborildi
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {visibleItems.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-10 text-center text-sm text-ink/40">
                  Sotuv bosqichida bandlar yo&apos;q
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableCard>

      <div>
        <h2 className="font-display text-lg font-bold text-ink mb-4">Mijoz takliflari</h2>

        <form
          onSubmit={handleAddProposal}
          className="bg-card rounded-3xl shadow-sm p-5 mb-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-medium text-ink/60 mb-1.5">Mijoz nomi</label>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              className="w-full rounded-xl border border-ink/10 bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/60 mb-1.5">Model</label>
            <select
              value={productionItemId}
              onChange={(e) => setProductionItemId(e.target.value)}
              required
              className="w-full rounded-xl border border-ink/10 bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">Tanlang</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.model.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/60 mb-1.5">Holat</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {Object.entries(PROPOSAL_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              Qo&apos;shish
            </button>
          </div>
        </form>

        <TableCard
          title="Takliflar"
          count={visibleProposals.length}
          search={proposalSearch}
          onSearchChange={setProposalSearch}
          sortValue={proposalSort}
          onSortChange={setProposalSort}
          sortOptions={PROPOSAL_SORT_OPTIONS}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/5 text-left text-xs uppercase tracking-wide text-ink/40">
                <th className="px-5 py-3 font-medium">Mijoz</th>
                <th className="px-5 py-3 font-medium">Model</th>
                <th className="px-5 py-3 font-medium">Sana</th>
                <th className="px-5 py-3 font-medium">Holat</th>
              </tr>
            </thead>
            <tbody>
              {visibleProposals.map((p) => (
                <tr key={p.id} className="border-b border-ink/5 last:border-0 h-[56px]">
                  <td className="px-5 py-3 font-medium text-ink">{p.clientName}</td>
                  <td className="px-5 py-3 text-ink/70">{p.productionItem.model.name}</td>
                  <td className="px-5 py-3 text-ink/70">{format(new Date(p.date), "dd.MM.yyyy")}</td>
                  <td className="px-5 py-3">
                    <StatusBadge
                      label={PROPOSAL_STATUS_LABELS[p.status]}
                      tone={p.status === "won" ? "done" : p.status === "lost" ? "overdue" : "progress"}
                    />
                  </td>
                </tr>
              ))}
              {visibleProposals.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-ink/40">
                    Takliflar yo&apos;q
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableCard>
      </div>

      <ModelDetailModal detail={selectedDetail} onClose={() => setSelectedDetail(null)} />
    </div>
  );
}
