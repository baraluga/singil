"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBill, uploadReceipt } from "@/lib/actions/bills";
import { MemberInput, BillItemInput, SplitMode } from "@/lib/types";
import { calculateEqualSplit } from "@/lib/utils/split";
import { formatCurrency } from "@/lib/utils/currency";
import SplitToggle from "./SplitToggle";
import MemberRow from "./MemberRow";
import ItemRow from "./ItemRow";
import ReceiptUpload from "./ReceiptUpload";
import ReconcileRow from "./ReconcileRow";

function newMember(): MemberInput {
  return { tempId: crypto.randomUUID(), name: "", amount: 0 };
}

function newItem(): BillItemInput {
  return { tempId: crypto.randomUUID(), name: "", amount: 0 };
}

export default function CreateBillForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const date = new Date().toISOString().split("T")[0];
  const [serviceChargeAmount, setServiceChargeAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode>("honesty");
  const [members, setMembers] = useState<MemberInput[]>([newMember(), newMember()]);
  const [billItems, setBillItems] = useState<BillItemInput[]>([newItem(), newItem()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (splitMode !== "equal") return;
    const shares = calculateEqualSplit(totalAmount, members.length);
    setMembers((prev) => prev.map((m, i) => ({ ...m, amount: shares[i] ?? 0 })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalAmount, members.length, splitMode]);

  useEffect(() => {
    if (splitMode !== "itemized") return;
    const itemsTotal = billItems.reduce((sum, item) => sum + item.amount, 0);
    setTotalAmount(Math.round(itemsTotal * 100) / 100);
  }, [splitMode, billItems]);

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
    if (mode === "itemized") {
      setBillItems((prev) => (prev.length ? prev : [newItem(), newItem()]));
    }
  }

  function handleItemNameChange(tempId: string, name: string) {
    setBillItems((prev) => prev.map((it) => (it.tempId === tempId ? { ...it, name } : it)));
  }

  function handleItemAmountChange(tempId: string, amount: number) {
    setBillItems((prev) => prev.map((it) => (it.tempId === tempId ? { ...it, amount } : it)));
  }

  function handleItemRemove(tempId: string) {
    setBillItems((prev) => prev.filter((it) => it.tempId !== tempId));
  }

  function addItem() {
    setBillItems((prev) => [...prev, newItem()]);
  }

  const totalAssigned = members.reduce((sum, m) => sum + m.amount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Bill name is required");
    if (splitMode === "itemized") {
      const validItems = billItems.filter((it) => it.name.trim() && it.amount > 0);
      if (validItems.length === 0) return setError("At least one item with name and amount is required");
    }
    if (totalAmount <= 0) return setError("Total amount must be greater than 0");
    if (serviceChargeAmount >= totalAmount && serviceChargeAmount > 0)
      return setError("Service charge cannot be equal to or exceed the total amount");
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

    const validItems = splitMode === "itemized"
      ? billItems.filter((it) => it.name.trim() && it.amount > 0).map((it) => ({ name: it.name.trim(), amount: it.amount }))
      : undefined;

    const result = await createBill({
      name: name.trim(),
      date,
      serviceChargeAmount,
      totalAmount,
      receiptUrl,
      splitMode,
      members: validMembers.map((m) => ({ name: m.name.trim(), amount: m.amount })),
      items: validItems,
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

      <div className="field-group">
        <label className="field-label">Receipt Photo</label>
        <ReceiptUpload preview={receiptPreview} onChange={handleReceiptChange} />
      </div>

      <div className="field-label" style={{ marginBottom: 8 }}>Split Mode</div>
      <SplitToggle value={splitMode} onChange={handleSplitModeChange} />

      {splitMode === "itemized" ? (
        <div className="field-group">
          <label className="field-label">Total Bill Amount</label>
          <div className="itemized-total-display">{formatCurrency(totalAmount)}</div>
        </div>
      ) : (
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
      )}

      {splitMode === "itemized" && (
        <>
          <div className="field-label" style={{ marginBottom: 8 }}>Receipt Items</div>
          <div className="items-list">
            {billItems.map((item, i) => (
              <ItemRow
                key={item.tempId}
                item={item}
                index={i}
                onNameChange={handleItemNameChange}
                onAmountChange={handleItemAmountChange}
                onRemove={handleItemRemove}
                canRemove={billItems.length > 1}
              />
            ))}
          </div>
          <button type="button" onClick={addItem} className="add-member-btn">
            ＋ Add item
          </button>
        </>
      )}

      <div className="field-group">
        <label className="field-label">Service Charge</label>
        <div className="field-input-prefix">
          <span className="prefix">₱</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={serviceChargeAmount || ""}
            onChange={(e) => setServiceChargeAmount(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="field-input"
          />
        </div>
      </div>

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

      {splitMode === "equal" && <ReconcileRow assigned={totalAssigned} total={totalAmount} />}

      {error && <p className="field-error">{error}</p>}

      <button type="submit" disabled={isSubmitting} className="btn-primary">
        {isSubmitting ? "Creating…" : "Create Bill & Get Link →"}
      </button>
    </form>
  );
}
