"use client";

import { useEffect, useRef, useState } from "react";
import { Bill, Member, PaymentMethod } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";
import { calcScPerPerson } from "@/lib/utils/split";
import { getAvatarColor, getInitial } from "@/lib/utils/avatars";
import Modal from "@/components/ui/Modal";
import Toast from "@/components/ui/Toast";
import PaymentMethodCard from "@/components/pay/PaymentMethodCard";
import QrModal from "@/components/pay/QrModal";
import { compressImage } from "@/lib/utils/image";
import { triggerPaymentCelebration } from "@/lib/utils/celebration";

interface PayeeViewProps {
  bill: Bill;
  members: Member[];
  paymentMethods: PaymentMethod[];
}

const STORAGE_KEY = (billId: string) => `singil:claim:${billId}`;

export default function PayeeView({ bill, members, paymentMethods }: PayeeViewProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Restore claimed member from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY(bill.id));
      if (stored && members.some((m) => m.id === stored)) {
        setSelectedMemberId(stored);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [claiming, setClaiming] = useState(false);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [qrModal, setQrModal] = useState<{ name: string; qrUrl: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [honestyItems, setHonestyItems] = useState<number[]>([0]);
  const [honestyConfirmed, setHonestyConfirmed] = useState(false);
  const [popping, setPopping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHonestyItems([0]);
    setHonestyConfirmed(false);
    setProofFile(null);
    setProofPreview(null);
    setProofUrl(null);
  }, [selectedMemberId]);

  const isHonesty = bill.split_mode === "honesty";
  const honestyAmount = honestyItems.reduce((s, v) => s + v, 0);
  const scPerPerson = calcScPerPerson(bill.service_charge_amount, members.length);
  const honestyTotal = honestyAmount + scPerPerson;

  const selectedMember = members.find((m) => m.id === selectedMemberId) ?? null;

  const date = new Date(bill.date).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  async function handleProofSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofPreview(URL.createObjectURL(file));
    const compressed = await compressImage(file);
    setProofFile(compressed);
  }

  async function handleClaim() {
    if (!selectedMember || claiming) return;
    setClaiming(true);
    try {
      let res: Response;
      if (proofFile) {
        const formData = new FormData();
        formData.append("file", proofFile);
        if (isHonesty) formData.append("amount", String(honestyAmount));
        res = await fetch(`/api/members/${selectedMember.id}/claim`, {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch(`/api/members/${selectedMember.id}/claim`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(isHonesty ? { amount: honestyAmount } : {}),
        });
      }
      if (res.ok) {
        const data = await res.json();
        setClaimedIds((prev) => new Set(prev).add(selectedMember.id));
        if (data.proof_url) setProofUrl(data.proof_url);
        triggerPaymentCelebration();
        setPopping(true);
        setTimeout(() => setPopping(false), 400);
        setToastMsg("Payment sent!");
        try { localStorage.setItem(STORAGE_KEY(bill.id), selectedMember.id); } catch {}
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

  async function handleCopyAmount() {
    if (!selectedMember) return;
    const amount = isHonesty && selectedMember.share_amount === 0 ? honestyTotal : selectedMember.share_amount;
    const rounded = Math.round(amount * 100) / 100;
    await navigator.clipboard.writeText(String(rounded));
    setToastMsg("Amount copied!");
  }

  const hasClaimed = selectedMember
    ? selectedMember.claimed_paid || claimedIds.has(selectedMember.id)
    : false;
  const claimProofUrl = proofUrl || selectedMember?.proof_url || null;

  if (bill.is_settled) {
    return (
      <main className="pay-page">
        <div className="pay-header">
          <p className="pay-header-sub">Brian is collecting for</p>
          <h1 className="pay-header-title">{bill.name}</h1>
          <p className="pay-header-date">{date}</p>
        </div>
        <div className="pay-inner" style={{ textAlign: "center", paddingTop: 48 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
          <p style={{ fontWeight: 600, fontSize: 16, color: "var(--green)" }}>This bill is settled</p>
          <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 6 }}>
            All payments have been confirmed by the organizer.
          </p>
        </div>
      </main>
    );
  }

  // Whether to show payment methods + claim CTA
  const showPaymentSection = !isHonesty || hasClaimed || honestyConfirmed;

  return (
    <main className="pay-page">
      <div className="pay-header">
        <p className="pay-header-sub">Brian is collecting for</p>
        <h1 className="pay-header-title">{bill.name}</h1>
        <p className="pay-header-date">{date}</p>
      </div>

      {!selectedMemberId ? (
        <div className="pay-inner">
          <p className="section-label">Who are you?</p>
          <div className="name-grid">
            {members.map((member, i) => {
              const colors = getAvatarColor(i);
              const isDone = member.is_paid || member.claimed_paid;
              return (
                <button
                  key={member.id}
                  className={`name-card${isDone ? " done" : ""}`}
                  onClick={() => setSelectedMemberId(member.id)}
                >
                  <div
                    className="member-avatar"
                    style={{ background: colors.bgValue, color: colors.textValue }}
                  >
                    {getInitial(member.name)}
                  </div>
                  <span className="name-card-label">{member.name}</span>
                  {member.is_paid && <span className="name-card-status">✓</span>}
                  {!member.is_paid && member.claimed_paid && <span className="name-card-status">⏳</span>}
                </button>
              );
            })}
          </div>
        </div>
      ) : selectedMember ? (
        <div className="pay-inner">
          {!hasClaimed && (
            <button className="pay-back-btn" onClick={() => setSelectedMemberId(null)}>
              ← Oops, wrong person!
            </button>
          )}

          {/* Honesty mode: two-step — item entry then review */}
          {isHonesty && !hasClaimed ? (
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
                            // eslint-disable-next-line jsx-a11y/no-autofocus
                            autoFocus={idx === 0}
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
                          <span>SC (split equally)</span>
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
                        <span>SC (split equally)</span>
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
            /* Equal mode, or post-claim honesty */
            <>
              <div className="share-card">
                <p className="share-card-label">Your share</p>
                <p className="share-amount">{formatCurrency(isHonesty ? honestyTotal : selectedMember.share_amount)}</p>
                {scPerPerson > 0 && (() => {
                  const amount = isHonesty ? honestyTotal : selectedMember.share_amount;
                  const food = amount - scPerPerson;
                  return (
                    <p className="share-breakdown">
                      {formatCurrency(food)} food + {formatCurrency(scPerPerson)} SC
                    </p>
                  );
                })()}
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
              <p className="section-label" style={{ marginTop: 20 }}>Pay via</p>
              {paymentMethods.length === 0 ? (
                <p className="pay-empty-methods">No payment methods set up yet. Ask Brian directly.</p>
              ) : (
                paymentMethods.map((pm) => (
                  <PaymentMethodCard
                    key={pm.id}
                    method={pm}
                    onTap={pm.qr_url ? () => setQrModal({ name: pm.name, qrUrl: pm.qr_url! }) : undefined}
                  />
                ))
              )}

              <div style={{ marginTop: 24 }}>
                {selectedMember.is_paid ? (
                  <button className="btn-claim confirmed" disabled>
                    ✓ Already confirmed
                  </button>
                ) : hasClaimed ? (
                  <>
                    <button className="btn-claim waiting" disabled>
                      ⏳ Waiting for confirmation
                    </button>
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
                  </>
                )}
              </div>
            </>
          )}
        </div>
      ) : null}

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
    </main>
  );
}
