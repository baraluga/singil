"use client";

import { useState } from "react";
import { BillItem, BillWithMembers, PaymentMethod } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";
import { calcScPerPerson } from "@/lib/utils/split";
import { findMemberByName } from "@/lib/utils/members";
import { useProofUpload } from "@/lib/hooks/useProofUpload";
import { triggerPaymentCelebration } from "@/lib/utils/celebration";
import Modal from "@/components/ui/Modal";
import Toast from "@/components/ui/Toast";
import PaymentMethodCard from "@/components/pay/PaymentMethodCard";
import QrModal from "@/components/pay/QrModal";
import ReceiptThumbnail from "@/components/pay/ReceiptThumbnail";
import AmountSummary from "@/components/pay/AmountSummary";
import ItemizedItemCard from "@/components/pay/ItemizedItemCard";
import ProofUploadButton from "@/components/pay/ProofUploadButton";

interface ConsolidatedPayeeFlowProps {
  unpaidBills: BillWithMembers[];
  doneBills: BillWithMembers[];
  memberName: string;
  paymentMethods: PaymentMethod[];
  collectionId: string;
  onAllClaimed: () => void;
}

export default function ConsolidatedPayeeFlow({
  unpaidBills,
  doneBills,
  memberName,
  paymentMethods,
  collectionId,
  onAllClaimed,
}: ConsolidatedPayeeFlowProps) {
  const initialItems: Record<string, number[]> = {};
  for (const bill of unpaidBills) {
    if (bill.split_mode === "honesty") initialItems[bill.id] = [0];
  }
  const [billItems, setBillItems] = useState<Record<string, number[]>>(initialItems);
  const [billSelectedItems, setBillSelectedItems] = useState<Record<string, Set<string>>>({});
  const hasHonestyBills = unpaidBills.some((b) => b.split_mode === "honesty");
  const hasItemizedBills = unpaidBills.some((b) => b.split_mode === "itemized");
  const needsItemPhase = hasHonestyBills || hasItemizedBills;
  const [phase, setPhase] = useState<"items" | "payment">(
    needsItemPhase ? "items" : "payment"
  );
  const [claiming, setClaiming] = useState(false);
  const [popping, setPopping] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [receiptModal, setReceiptModal] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<{ name: string; qrUrl: string } | null>(null);
  const { proofFile, proofPreview, fileInputRef, handleProofSelect } = useProofUpload();

  function getBillTotal(bill: BillWithMembers): number {
    const member = findMemberByName(memberName, bill)!;
    if (bill.split_mode === "equal") return member.share_amount;
    const scPerPerson = calcScPerPerson(bill.service_charge_amount, bill.members.length);
    if (bill.split_mode === "itemized") {
      const selected = billSelectedItems[bill.id] ?? new Set<string>();
      const foodAmount = (bill.items ?? [])
        .filter((i) => selected.has(i.id))
        .reduce((s, i) => s + i.amount, 0);
      return foodAmount > 0 ? foodAmount + scPerPerson : 0;
    }
    const foodAmount = (billItems[bill.id] ?? [0]).reduce((s, v) => s + v, 0);
    if (foodAmount === 0) return 0;
    return foodAmount + scPerPerson;
  }

  const grandTotal = unpaidBills.reduce((sum, bill) => sum + getBillTotal(bill), 0);

  const allHonestyFilled = unpaidBills
    .filter((b) => b.split_mode === "honesty")
    .every((b) => (billItems[b.id] ?? [0]).reduce((s, v) => s + v, 0) > 0);

  const allItemizedFilled = unpaidBills
    .filter((b) => b.split_mode === "itemized")
    .every((b) => (billSelectedItems[b.id]?.size ?? 0) > 0);

  async function handleClaim() {
    if (claiming) return;
    setClaiming(true);
    try {
      const formData = new FormData();
      if (proofFile) formData.append("file", proofFile);

      const claimsPayload = unpaidBills.map((bill) => {
        const member = findMemberByName(memberName, bill)!;
        const isHonesty = bill.split_mode === "honesty";
        const isItemized = bill.split_mode === "itemized";
        return {
          memberId: member.id,
          ...(isHonesty && {
            amount: (billItems[bill.id] ?? [0]).reduce((s, v) => s + v, 0),
          }),
          ...(isItemized && {
            itemIds: [...(billSelectedItems[bill.id] ?? new Set<string>())],
          }),
        };
      });

      formData.append("claims", JSON.stringify(claimsPayload));
      const res = await fetch(`/api/collections/${collectionId}/claim`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        triggerPaymentCelebration();
        setPopping(true);
        setTimeout(() => setPopping(false), 400);
        setToastMsg("Payment sent!");
        onAllClaimed();
      } else {
        const data = await res.json().catch(() => ({}));
        setToastMsg(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setToastMsg("Network error. Please check your connection.");
    } finally {
      setClaiming(false);
    }
  }

  function toggleBillItem(billId: string, itemId: string) {
    setBillSelectedItems((prev) => {
      const next = new Set(prev[billId] ?? []);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return { ...prev, [billId]: next };
    });
  }

  if (unpaidBills.length === 0) {
    return (
      <>
        {doneBills.length > 0 && <DoneSection doneBills={doneBills} memberName={memberName} />}
      </>
    );
  }

  return (
    <>
      {phase === "items" ? (
        <>
          {unpaidBills.map((bill) => {
            const member = findMemberByName(memberName, bill)!;
            const isHonesty = bill.split_mode === "honesty";
            const items = billItems[bill.id] ?? [];
            const foodAmount = items.reduce((s, v) => s + v, 0);
            const scPerPerson = calcScPerPerson(bill.service_charge_amount, bill.members.length);
            const billTotal = isHonesty ? foodAmount + scPerPerson : member.share_amount;
            const date = new Date(bill.date).toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
            });

            return (
              <div key={bill.id} className="consolidated-bill-section">
                <div className="consolidated-bill-header">
                  <span className="consolidated-bill-name">{bill.name}</span>
                  <span className="consolidated-bill-date">{date}</span>
                  {isHonesty && foodAmount === 0 && (
                    <span className="bill-needs-items">needs items</span>
                  )}
                  {bill.split_mode === "itemized" && (billSelectedItems[bill.id]?.size ?? 0) === 0 && (
                    <span className="bill-needs-items">select items</span>
                  )}
                </div>

                {bill.receipt_url && (
                  (isHonesty || bill.split_mode === "itemized") ? (
                    <ReceiptThumbnail src={bill.receipt_url} onClick={() => setReceiptModal(bill.receipt_url!)} />
                  ) : (
                    <button
                      className="receipt-link-btn"
                      onClick={() => setReceiptModal(bill.receipt_url!)}
                    >
                      🧾 View receipt
                    </button>
                  )
                )}

                {bill.split_mode === "itemized" ? (
                  (() => {
                    const billItemsList: BillItem[] = bill.items ?? [];
                    const selected = billSelectedItems[bill.id] ?? new Set<string>();
                    const selectedAmount = billItemsList
                      .filter((i) => selected.has(i.id))
                      .reduce((s, i) => s + i.amount, 0);
                    return (
                      <div className="share-card">
                        <p className="share-card-label">Select your items</p>
                        <div className="itemized-list">
                          {billItemsList.map((item) => {
                            const claimedByOther = item.claimed_by && !bill.members.some(
                              (m) => m.name.toLowerCase().trim() === memberName.toLowerCase().trim() && m.id === item.claimed_by
                            );
                            const claimerName = claimedByOther
                              ? bill.members.find((m) => m.id === item.claimed_by)?.name ?? "Someone"
                              : null;
                            return (
                              <ItemizedItemCard
                                key={item.id}
                                name={item.name}
                                amount={item.amount}
                                isSelected={selected.has(item.id)}
                                claimerName={claimerName}
                                onToggle={() => toggleBillItem(bill.id, item.id)}
                              />
                            );
                          })}
                        </div>
                        {selectedAmount > 0 && (
                          <AmountSummary
                            lines={[{ label: "Subtotal", amount: selectedAmount }]}
                            scPerPerson={scPerPerson}
                            total={{ label: "Bill total", amount: selectedAmount + scPerPerson }}
                          />
                        )}
                      </div>
                    );
                  })()
                ) : isHonesty ? (
                  <div className="share-card">
                    <p className="share-card-label">Your items</p>
                    <div className="honesty-items-list">
                      {items.map((val, idx) => (
                        <div key={idx} className="honesty-item-row">
                          <div className="field-input-prefix" style={{ flex: 1 }}>
                            <span className="prefix">₱</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={val || ""}
                              onChange={(e) => {
                                const updated = [...items];
                                updated[idx] = parseFloat(e.target.value) || 0;
                                setBillItems((prev) => ({ ...prev, [bill.id]: updated }));
                              }}
                              placeholder="0.00"
                              className="field-input"
                            />
                          </div>
                          {items.length > 1 && (
                            <button
                              type="button"
                              className="honesty-item-remove"
                              onClick={() =>
                                setBillItems((prev) => ({
                                  ...prev,
                                  [bill.id]: items.filter((_, i) => i !== idx),
                                }))
                              }
                              aria-label="Remove item"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="honesty-add-item-btn"
                      onClick={() =>
                        setBillItems((prev) => ({ ...prev, [bill.id]: [...items, 0] }))
                      }
                    >
                      + Add item
                    </button>
                    {foodAmount > 0 && (
                      <AmountSummary
                        lines={[{ label: "Subtotal", amount: foodAmount }]}
                        scPerPerson={scPerPerson}
                        total={{ label: "Bill total", amount: billTotal }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="share-card">
                    <p className="share-amount">{formatCurrency(member.share_amount)}</p>
                    {scPerPerson > 0 && (
                      <p className="share-breakdown">
                        {formatCurrency(member.share_amount - scPerPerson)} food +{" "}
                        {formatCurrency(scPerPerson)} SC
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div className="consolidated-grand-total">
            <span>Total across all bills</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
          <button
            type="button"
            className="btn-primary"
            disabled={!allHonestyFilled || !allItemizedFilled}
            onClick={() => setPhase("payment")}
          >
            Confirm items →
          </button>
        </>
      ) : (
        <>
          {needsItemPhase && (
            <button
              className="pay-back-btn"
              style={{ marginBottom: 12 }}
              onClick={() => setPhase("items")}
            >
              ← Edit items
            </button>
          )}

          <div className="share-card">
            <p className="share-card-label">Your total</p>
            <p className="share-amount">{formatCurrency(grandTotal)}</p>
            <AmountSummary
              lines={unpaidBills.map((bill) => ({ label: bill.name, amount: getBillTotal(bill) }))}
              style={{ marginTop: 8 }}
            />
            <button
              className="share-copy-btn"
              onClick={async () => {
                await navigator.clipboard.writeText(String(Math.round(grandTotal * 100) / 100));
                setToastMsg("Amount copied!");
              }}
            >
              Copy amount
            </button>
          </div>

          <p className="section-label" style={{ marginTop: 16 }}>Pay via</p>
          {paymentMethods.length === 0 ? (
            <p className="pay-empty-methods">No payment methods set up yet.</p>
          ) : (
            paymentMethods.map((pm) => (
              <PaymentMethodCard
                key={pm.id}
                method={pm}
                onTap={
                  pm.qr_url
                    ? () => setQrModal({ name: pm.name, qrUrl: pm.qr_url! })
                    : undefined
                }
              />
            ))
          )}

          <div style={{ marginTop: 16 }}>
            <ProofUploadButton
              proofPreview={proofPreview}
              fileInputRef={fileInputRef}
              onSelect={handleProofSelect}
            />
            <button
              className={`btn-claim${popping ? " pop" : ""}`}
              onClick={handleClaim}
              disabled={claiming}
              style={{ marginTop: 10 }}
            >
              {claiming ? "Sending..." : "Bayad na ako!"}
            </button>
          </div>
        </>
      )}

      {doneBills.length > 0 && <DoneSection doneBills={doneBills} memberName={memberName} />}

      {receiptModal && (
        <Modal src={receiptModal} onClose={() => setReceiptModal(null)} />
      )}
      {qrModal && (
        <QrModal
          methodName={qrModal.name}
          qrUrl={qrModal.qrUrl}
          onClose={() => setQrModal(null)}
        />
      )}
      {toastMsg && <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />}
    </>
  );
}

function DoneSection({
  doneBills,
  memberName,
}: {
  doneBills: BillWithMembers[];
  memberName: string;
}) {
  return (
    <div className="dimmed-section">
      <p className="section-label" style={{ marginBottom: 8 }}>Already done</p>
      {doneBills.map((bill) => {
        const member = findMemberByName(memberName, bill)!;
        const date = new Date(bill.date).toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
        });
        return (
          <div key={bill.id} className="dimmed-bill-row">
            <span>{bill.name} · {date}</span>
            {member.is_paid ? (
              <span className="bill-status-chip paid">✓ Paid</span>
            ) : (
              <span className="bill-status-chip claimed">⏳ Claimed</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
