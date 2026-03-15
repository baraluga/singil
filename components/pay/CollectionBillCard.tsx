"use client";

import { useRef, useState } from "react";
import { BillWithMembers, Member, PaymentMethod } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";
import Modal from "@/components/ui/Modal";
import Toast from "@/components/ui/Toast";
import PaymentMethodCard from "@/components/pay/PaymentMethodCard";
import QrModal from "@/components/pay/QrModal";

interface CollectionBillCardProps {
  bill: BillWithMembers;
  member: Member;
  paymentMethods: PaymentMethod[];
  isExpanded: boolean;
  onToggle: () => void;
  onClaimed: (memberId: string) => void;
}

export default function CollectionBillCard({
  bill,
  member,
  paymentMethods,
  isExpanded,
  onToggle,
  onClaimed,
}: CollectionBillCardProps) {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(member.claimed_paid);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [qrModal, setQrModal] = useState<{ name: string; qrUrl: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [honestyItems, setHonestyItems] = useState<number[]>([0]);
  const [honestyConfirmed, setHonestyConfirmed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isHonesty = bill.split_mode === "honesty";
  const honestyAmount = honestyItems.reduce((s, v) => s + v, 0);
  const scPerPerson = bill.service_charge_amount / Math.max(bill.members.length, 1);
  const honestyTotal = honestyAmount + scPerPerson;

  const isPaid = member.is_paid;
  const hasClaimed = claimed || member.claimed_paid;
  const claimProofUrl = proofUrl || member.proof_url || null;
  const showPaymentSection = !isHonesty || hasClaimed || honestyConfirmed;

  const displayAmount = isHonesty && member.share_amount === 0
    ? null
    : member.share_amount;

  const date = new Date(bill.date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });

  function getStatusChip() {
    if (isPaid) return <span className="bill-status-chip paid">✓ Paid</span>;
    if (hasClaimed) return <span className="bill-status-chip claimed">⏳ Claimed</span>;
    if (isHonesty && member.share_amount === 0) return <span className="bill-status-chip pending">Awaiting</span>;
    return <span className="bill-status-chip pending">Unpaid</span>;
  }

  function handleProofSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  }

  async function handleCopyAmount() {
    const amount = isHonesty ? honestyTotal : member.share_amount;
    const rounded = Math.round(amount * 100) / 100;
    await navigator.clipboard.writeText(String(rounded));
    setToastMsg("Amount copied!");
  }

  async function handleClaim() {
    if (claiming) return;
    setClaiming(true);
    try {
      let res: Response;
      if (proofFile) {
        const formData = new FormData();
        formData.append("file", proofFile);
        if (isHonesty) formData.append("amount", String(honestyAmount));
        res = await fetch(`/api/members/${member.id}/claim`, { method: "POST", body: formData });
      } else {
        res = await fetch(`/api/members/${member.id}/claim`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(isHonesty ? { amount: honestyAmount } : {}),
        });
      }
      if (res.ok) {
        const data = await res.json();
        setClaimed(true);
        if (data.proof_url) setProofUrl(data.proof_url);
        setToastMsg("Payment sent!");
        onClaimed(member.id);
        onToggle(); // collapse after claim
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

  return (
    <div className={`collection-bill-card${isExpanded ? " expanded" : ""}`}>
      {/* Collapsed header — always visible */}
      <button className="collection-bill-card-header" onClick={onToggle}>
        <div className="collection-bill-card-info">
          <span className="collection-bill-card-name">{bill.name}</span>
          <span className="collection-bill-card-date">{date}</span>
        </div>
        <div className="collection-bill-card-right">
          {displayAmount != null && (
            <span className="collection-bill-card-amount">{formatCurrency(displayAmount)}</span>
          )}
          {getStatusChip()}
          <span className="collection-bill-card-chevron">{isExpanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Expanded payment flow */}
      {isExpanded && (
        <div className="collection-bill-card-body">
          {isPaid ? (
            <button className="btn-claim confirmed" disabled>✓ Already confirmed</button>
          ) : hasClaimed ? (
            <>
              <button className="btn-claim waiting" disabled>⏳ Waiting for confirmation</button>
              {claimProofUrl && (
                <button className="proof-thumb-btn" onClick={() => setProofOpen(true)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={claimProofUrl} alt="Payment proof" />
                  <span>View proof</span>
                </button>
              )}
            </>
          ) : (
            <>
              {/* Honesty mode: two-step flow */}
              {isHonesty ? (
                <>
                  {bill.receipt_url && (
                    <button
                      className="honesty-receipt-btn"
                      onClick={() => setReceiptOpen(true)}
                      aria-label="View receipt"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={bill.receipt_url} alt="Receipt" className="honesty-receipt-img" />
                      <span className="honesty-receipt-overlay">🔍 Tap to expand</span>
                    </button>
                  )}

                  {!honestyConfirmed ? (
                    /* Step 1: item entry */
                    <div className="share-card">
                      <p className="share-card-label">Your items</p>
                      <div className="honesty-items-list">
                        {honestyItems.map((val, idx) => (
                          <div key={idx} className="honesty-item-row">
                            <div className="field-input-prefix" style={{ flex: 1 }}>
                              <span className="prefix">₱</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={val || ""}
                                onChange={(e) => {
                                  const updated = [...honestyItems];
                                  updated[idx] = parseFloat(e.target.value) || 0;
                                  setHonestyItems(updated);
                                }}
                                placeholder="0.00"
                                className="field-input"
                              />
                            </div>
                            {honestyItems.length > 1 && (
                              <button
                                type="button"
                                className="honesty-item-remove"
                                onClick={() => setHonestyItems(honestyItems.filter((_, i) => i !== idx))}
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
                        onClick={() => setHonestyItems([...honestyItems, 0])}
                      >
                        + Add item
                      </button>
                      {honestyAmount > 0 && (
                        <div className="honesty-summary">
                          <div className="honesty-summary-row">
                            <span>Subtotal</span>
                            <span>{formatCurrency(honestyAmount)}</span>
                          </div>
                          {scPerPerson > 0 && (
                            <div className="honesty-summary-row sc">
                              <span>SC (your share)</span>
                              <span>+{formatCurrency(scPerPerson)}</span>
                            </div>
                          )}
                          <div className="honesty-summary-row total">
                            <span>Total</span>
                            <span>{formatCurrency(honestyTotal)}</span>
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={honestyAmount <= 0}
                        onClick={() => setHonestyConfirmed(true)}
                        style={{ marginTop: 16 }}
                      >
                        Confirm items →
                      </button>
                    </div>
                  ) : (
                    /* Step 2: review summary */
                    <div className="share-card">
                      <button
                        className="pay-back-btn"
                        style={{ marginBottom: 12 }}
                        onClick={() => setHonestyConfirmed(false)}
                      >
                        ← Edit items
                      </button>
                      <p className="share-card-label">Your total</p>
                      <p className="share-amount">{formatCurrency(honestyTotal)}</p>
                      <div className="honesty-summary" style={{ marginBottom: 12 }}>
                        <div className="honesty-summary-row">
                          <span>Subtotal</span>
                          <span>{formatCurrency(honestyAmount)}</span>
                        </div>
                        {scPerPerson > 0 && (
                          <div className="honesty-summary-row sc">
                            <span>SC (your share)</span>
                            <span>+{formatCurrency(scPerPerson)}</span>
                          </div>
                        )}
                      </div>
                      <button className="share-copy-btn" onClick={handleCopyAmount}>
                        Copy amount
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Regular share card */}
                  <div className="share-card">
                    <p className="share-card-label">Your share</p>
                    <p className="share-amount">{formatCurrency(member.share_amount)}</p>
                    {scPerPerson > 0 && (
                      <p className="share-breakdown">
                        {formatCurrency(member.share_amount - scPerPerson)} food + {formatCurrency(scPerPerson)} SC
                      </p>
                    )}
                    <button className="share-copy-btn" onClick={handleCopyAmount}>
                      Copy amount
                    </button>
                  </div>
                  {bill.receipt_url && (
                    <button className="receipt-link-btn" onClick={() => setReceiptOpen(true)}>
                      🧾 View receipt
                    </button>
                  )}
                </>
              )}

              {/* Payment methods + CTA — hidden during honesty item entry step */}
              {showPaymentSection && (
                <>
                  <p className="section-label" style={{ marginTop: 16 }}>Pay via</p>
                  {paymentMethods.length === 0 ? (
                    <p className="pay-empty-methods">No payment methods set up yet.</p>
                  ) : (
                    paymentMethods.map((pm) => (
                      <PaymentMethodCard
                        key={pm.id}
                        method={pm}
                        onTap={pm.qr_url ? () => setQrModal({ name: pm.name, qrUrl: pm.qr_url! }) : undefined}
                      />
                    ))
                  )}

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
                      className="btn-claim"
                      onClick={handleClaim}
                      disabled={claiming}
                      style={{ marginTop: 10 }}
                    >
                      {claiming ? "Sending..." : "Bayad na ako!"}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {receiptOpen && bill.receipt_url && (
        <Modal src={bill.receipt_url} onClose={() => setReceiptOpen(false)} />
      )}
      {proofOpen && claimProofUrl && (
        <Modal src={claimProofUrl} onClose={() => setProofOpen(false)} />
      )}
      {qrModal && (
        <QrModal
          methodName={qrModal.name}
          qrUrl={qrModal.qrUrl}
          onClose={() => setQrModal(null)}
        />
      )}
      {toastMsg && <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />}
    </div>
  );
}
