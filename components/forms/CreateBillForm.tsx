"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { createBill } from "@/lib/actions/bills";
import { MemberInput, SplitMode } from "@/lib/types";
import { calculateEqualSplit } from "@/lib/utils/split";
import { formatCurrency } from "@/lib/utils/currency";
import SplitToggle from "./SplitToggle";
import MemberRow from "./MemberRow";
import ReceiptUpload from "./ReceiptUpload";
import ReconcileRow from "./ReconcileRow";

function newMember(): MemberInput {
  return { tempId: crypto.randomUUID(), name: "", amount: 0 };
}

export default function CreateBillForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [serviceChargePct, setServiceChargePct] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [members, setMembers] = useState<MemberInput[]>([newMember(), newMember()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recompute equal shares whenever total or member count changes
  useEffect(() => {
    if (splitMode !== "equal") return;
    const shares = calculateEqualSplit(totalAmount, members.length);
    setMembers((prev) => prev.map((m, i) => ({ ...m, amount: shares[i] ?? 0 })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalAmount, members.length, splitMode]);

  function handleReceiptChange(file: File) {
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  }

  function handleNameChange(tempId: string, newName: string) {
    setMembers((prev) => prev.map((m) => (m.tempId === tempId ? { ...m, name: newName } : m)));
  }

  function handleAmountChange(tempId: string, amount: number) {
    setMembers((prev) => prev.map((m) => (m.tempId === tempId ? { ...m, amount } : m)));
  }

  function handleRemove(tempId: string) {
    setMembers((prev) => prev.filter((m) => m.tempId !== tempId));
  }

  function addMember() {
    setMembers((prev) => [...prev, newMember()]);
  }

  function handleSplitModeChange(mode: SplitMode) {
    setSplitMode(mode);
    if (mode === "equal") {
      const shares = calculateEqualSplit(totalAmount, members.length);
      setMembers((prev) => prev.map((m, i) => ({ ...m, amount: shares[i] ?? 0 })));
    }
  }

  const totalAssigned = members.reduce((sum, m) => sum + m.amount, 0);
  const isBalanced = Math.abs(totalAssigned - totalAmount) < 0.01;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Bill name is required");
    if (totalAmount <= 0) return setError("Total amount must be greater than 0");
    const validMembers = members.filter((m) => m.name.trim());
    if (validMembers.length === 0) return setError("At least one member with a name is required");
    if (splitMode === "manual" && !isBalanced) return setError("Member amounts must add up to the total");

    setIsSubmitting(true);

    let receiptUrl: string | null = null;
    if (receiptFile) {
      const supabase = createClient();
      const ext = receiptFile.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { data, error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(path, receiptFile, { upsert: true });
      if (uploadError) {
        setError(`Receipt upload failed: ${uploadError.message}`);
        setIsSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(data.path);
      receiptUrl = urlData.publicUrl;
    }

    const result = await createBill({
      name: name.trim(),
      date,
      serviceChargePct,
      totalAmount,
      receiptUrl,
      members: validMembers.map((m) => ({ name: m.name.trim(), amount: m.amount })),
    });

    if ("error" in result) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    router.push(`/bills/${result.id}`);
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Name */}
      <div className="mb-4">
        <label className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-ink-muted mb-1.5">
          Restaurant / Occasion
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ramen Nagi, BGC"
          className="w-full bg-surface border border-border rounded-[10px] px-3.5 py-3 text-sm text-ink placeholder-[#BEB5A8] outline-none focus:border-accent"
        />
      </div>

      {/* Date + SC% */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div>
          <label className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-ink-muted mb-1.5">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-surface border border-border rounded-[10px] px-3.5 py-3 text-sm text-ink outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-ink-muted mb-1.5">
            Service Charge
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              value={serviceChargePct || ""}
              onChange={(e) => setServiceChargePct(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full bg-surface border border-border rounded-[10px] px-3.5 py-3 text-sm text-ink outline-none focus:border-accent pr-7"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted">%</span>
          </div>
        </div>
      </div>

      {/* Total amount */}
      <div className="mb-4">
        <label className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-ink-muted mb-1.5">
          Total Bill Amount
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-muted">₱</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={totalAmount || ""}
            onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="w-full bg-surface border border-border rounded-[10px] pl-7 pr-3.5 py-3 text-sm text-ink outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Receipt upload */}
      <div className="mb-4">
        <label className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-ink-muted mb-1.5">
          Receipt Photo
        </label>
        <ReceiptUpload preview={receiptPreview} onChange={handleReceiptChange} />
      </div>

      {/* Split toggle */}
      <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-ink-muted mb-2">
        Split Mode
      </div>
      <SplitToggle value={splitMode} onChange={handleSplitModeChange} />

      {/* Members */}
      <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-ink-muted mb-2">
        Members
      </div>
      <div className="flex flex-col gap-2 mb-2.5">
        {members.map((m, i) => (
          <MemberRow
            key={m.tempId}
            member={m}
            index={i}
            splitMode={splitMode}
            onNameChange={handleNameChange}
            onAmountChange={handleAmountChange}
            onRemove={handleRemove}
            canRemove={members.length > 1}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={addMember}
        className="w-full flex items-center justify-center gap-1.5 bg-none border border-dashed border-border rounded-[10px] px-3.5 py-2.5 text-ink-muted text-[13px] font-medium"
      >
        ＋ Add member
      </button>

      {/* Reconcile */}
      <ReconcileRow assigned={totalAssigned} total={totalAmount} />

      {error && <p className="text-[#DC2626] text-xs mb-3">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-accent text-white rounded-[14px] py-4 text-[15px] font-semibold disabled:opacity-50"
      >
        {isSubmitting ? "Creating…" : "Create Bill & Get Link →"}
      </button>
    </form>
  );
}
