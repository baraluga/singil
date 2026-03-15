"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBill, uploadReceipt } from "@/lib/actions/bills";
import { MemberInput, SplitMode } from "@/lib/types";
import { calculateEqualSplit } from "@/lib/utils/split";
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
  const [splitMode, setSplitMode] = useState<SplitMode>("honesty");
  const [members, setMembers] = useState<MemberInput[]>([newMember(), newMember()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } else {
      setMembers((prev) => prev.map((m) => ({ ...m, amount: 0 })));
    }
  }

  const totalAssigned = members.reduce((sum, m) => sum + m.amount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Bill name is required");
    if (totalAmount <= 0) return setError("Total amount must be greater than 0");
    const validMembers = members.filter((m) => m.name.trim());
    if (validMembers.length === 0) return setError("At least one member with a name is required");
    setIsSubmitting(true);

    let receiptUrl: string | null = null;
    if (receiptFile) {
      const fd = new FormData();
      fd.append("file", receiptFile);
      const result = await uploadReceipt(fd);
      if ("error" in result) {
        setError(`Receipt upload failed: ${result.error}`);
        setIsSubmitting(false);
        return;
      }
      receiptUrl = result.url;
    }

    const result = await createBill({
      name: name.trim(),
      date,
      serviceChargePct,
      totalAmount,
      receiptUrl,
      splitMode,
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
      <div className="field-group">
        <label className="field-label">Restaurant / Occasion</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ramen Nagi, BGC"
          className="field-input"
        />
      </div>

      <div className="row-2" style={{ marginBottom: 16 }}>
        <div className="field-group" style={{ marginBottom: 0 }}>
          <label className="field-label">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="field-input"
          />
        </div>
        <div className="field-group" style={{ marginBottom: 0 }}>
          <label className="field-label">Service Charge</label>
          <div className="field-input-suffix">
            <input
              type="number"
              min="0"
              max="100"
              value={serviceChargePct || ""}
              onChange={(e) => setServiceChargePct(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="field-input"
            />
            <span className="suffix">%</span>
          </div>
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">Total Bill Amount</label>
        <div className="field-input-prefix">
          <span className="prefix">₱</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={totalAmount || ""}
            onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="field-input"
          />
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">Receipt Photo</label>
        <ReceiptUpload preview={receiptPreview} onChange={handleReceiptChange} />
      </div>

      <div className="field-label" style={{ marginBottom: 8 }}>Split Mode</div>
      <SplitToggle value={splitMode} onChange={handleSplitModeChange} />

      <div className="field-label" style={{ marginBottom: 8 }}>Members</div>
      <div className="members-list">
        {members.map((m, i) => (
          <MemberRow
            key={m.tempId}
            member={m}
            index={i}
            splitMode={splitMode}
            onNameChange={handleNameChange}
            onRemove={handleRemove}
            canRemove={members.length > 1}
          />
        ))}
      </div>
      <button type="button" onClick={addMember} className="add-member-btn">
        ＋ Add member
      </button>

      {splitMode !== "honesty" && <ReconcileRow assigned={totalAssigned} total={totalAmount} />}

      {error && <p className="field-error">{error}</p>}

      <button type="submit" disabled={isSubmitting} className="btn-primary">
        {isSubmitting ? "Creating…" : "Create Bill & Get Link →"}
      </button>
    </form>
  );
}
