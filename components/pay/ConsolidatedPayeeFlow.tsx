"use client";

import { useRef, useState } from "react";
import { BillWithMembers, Member, PaymentMethod } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";
import { calcScPerPerson } from "@/lib/utils/split";
import Modal from "@/components/ui/Modal";
import Toast from "@/components/ui/Toast";
import PaymentMethodCard from "@/components/pay/PaymentMethodCard";
import QrModal from "@/components/pay/QrModal";
import { compressImage } from "@/lib/utils/image";
import { triggerPaymentCelebration } from "@/lib/utils/celebration";

interface ConsolidatedPayeeFlowProps {
  unpaidBills: BillWithMembers[];
  doneBills: BillWithMembers[];
  memberName: string;
  paymentMethods: PaymentMethod[];
  collectionId: string;
  onAllClaimed: () => void;
}

function findMemberByName(name: string, bill: BillWithMembers): Member | null {
  return (
    bill.members.find(
      (m) => m.name.toLowerCase().trim() === name.toLowerCase().trim()
    ) ?? null
  );
}

export default function ConsolidatedPayeeFlow({
  unpaidBills,
  doneBills,
  memberName,
  paymentMethods,
  collectionId,
  onAllClaimed,
}: ConsolidatedPayeeFlowProps) {
  // Per-bill item arrays (only for honesty bills)
  const initialItems: Record<string, number[]> = {};
  for (const bill of unpaidBills) {
    if (bill.split_mode === "honesty") initialItems[bill.id] = [0];
  }
  const [billItems, setBillItems] = useState<Record<string, number[]>>(initialItems);
  const hasHonestyBills = unpaidBills.some((b) => b.split_mode === "honesty");
  const [phase, setPhase] = useState<"items" | "payment">(
    hasHonestyBills ? "items" : "payment"
  );
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [popping, setPopping] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [receiptModal, setReceiptModal] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<{ name: string; qrUrl: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Derived amounts ──────────────────────────────────────────────────────────

  function getBillTotal(bill: BillWithMembers): number {
    const member = findMemberByName(memberName, bill)!;
    if (bill.split_mode === "equal") return member.share_amount;
    const foodAmount = (billItems[bill.id] ?? [0]).reduce((s, v) => s + v, 0);
    if (foodAmount === 0) return 0;
    const scPerPerson = calcScPerPerson(bill.service_charge_amount, bill.members.length);
    return foodAmount + scPerPerson;
  }

  const grandTotal = unpaidBills.reduce((sum, bill) => sum + getBillTotal(bill), 0);

  const allHonestyFilled = unpaidBills
    .filter((b) => b.split_mode === "honesty")
    .every((b) => (billItems[b.id] ?? [0]).reduce((s, v) => s + v, 0) > 0);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  async function handleProofSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofPreview(URL.createObjectURL(file));
    const compressed = await compressImage(file);
    setProofFile(compressed);
  }

  async function handleClaim() {
    if (claiming) return;
    setClaiming(true);
    try {
      const formData = new FormData();
      if (proofFile) formData.append("file", proofFile);

      const claimsPayload = unpaidBills.map((bill) => {
        const member = findMemberByName(memberName, bill)!;
        const isHonesty = bill.split_mode === "honesty";
        return {
          memberId: member.id,
          ...(isHonesty && {
            amount: (billItems[bill.id] ?? [0]).reduce((s, v) => s + v, 0),
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

  // ── Render ───────────────────────────────────────────────────────────────────

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
        /* ── Phase 1: Item entry ─────────────────────────────────────── */
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
                </div>

                {bill.receipt_url && (
                  isHonesty ? (
                    <button
                      className="honesty-receipt-btn"
                      onClick={() => setReceiptModal(bill.receipt_url!)}
                      aria-label="View receipt"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={bill.receipt_url} alt="Receipt" className="honesty-receipt-img" />
                      <span className="honesty-receipt-overlay">🔍 Tap to expand</span>
                    </button>
                  ) : (
                    <button
                      className="receipt-link-btn"
                      onClick={() => setReceiptModal(bill.receipt_url!)}
                    >
                      🧾 View receipt
                    </button>
                  )
                )}

                {isHonesty ? (
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
                      <div className="honesty-summary">
                        <div className="honesty-summary-row">
                          <span>Subtotal</span>
                          <span>{formatCurrency(foodAmount)}</span>
                        </div>
                        {scPerPerson > 0 && (
                          <div className="honesty-summary-row sc">
                            <span>SC (split equally)</span>
                            <span>+{formatCurrency(scPerPerson)}</span>
                          </div>
                        )}
                        <div className="honesty-summary-row total">
                          <span>Bill total</span>
                          <span>{formatCurrency(billTotal)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Equal mode: fixed amount */
                  <div className="share-card">
                    <p className="share-card-label">Your share</p>
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

          {/* Grand total + confirm */}
          <div className="consolidated-grand-total">
            <span>Total across all bills</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
          <button
            type="button"
            className="btn-primary"
            disabled={!allHonestyFilled}
            onClick={() => setPhase("payment")}
          >
            Confirm items →
          </button>
        </>
      ) : (
        /* ── Phase 2: Payment ────────────────────────────────────────── */
        <>
          {hasHonestyBills && (
            <button
              className="pay-back-btn"
              style={{ marginBottom: 12 }}
              onClick={() => setPhase("items")}
            >
              ← Edit items
            </button>
          )}

          {/* Per-bill summary */}
          <div className="share-card">
            <p className="share-card-label">Your total</p>
            <p className="share-amount">{formatCurrency(grandTotal)}</p>
            <div className="honesty-summary" style={{ marginTop: 8 }}>
              {unpaidBills.map((bill) => (
                <div key={bill.id} className="honesty-summary-row">
                  <span>{bill.name}</span>
                  <span>{formatCurrency(getBillTotal(bill))}</span>
                </div>
              ))}
            </div>
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

          {/* Payment methods */}
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

          {/* Proof upload + claim */}
          <div style={{ marginTop: 16 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handleProofSelect}
            />
            {proofPreview ? (
              <button
                className="proof-attach-btn has-proof"
                onClick={() => fileInputRef.current?.click()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={proofPreview} alt="Proof preview" className="proof-preview-thumb" />
                <span>Change proof</span>
              </button>
            ) : (
              <button
                className="proof-attach-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                📎 Attach payment proof (optional)
              </button>
            )}
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

      {/* Already done bills */}
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
