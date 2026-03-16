"use client";

import { useEffect, useState } from "react";
import { Bill, BillItem, Member, PaymentMethod } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";
import { calcScPerPerson } from "@/lib/utils/split";
import { getAvatarColor, getInitial } from "@/lib/utils/avatars";
import { submitClaim } from "@/lib/utils/claim";
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

interface PayeeViewProps {
  bill: Bill;
  members: Member[];
  paymentMethods: PaymentMethod[];
  billItems?: BillItem[];
}

const STORAGE_KEY = (billId: string) => `singil:claim:${billId}`;

export default function PayeeView({ bill, members, paymentMethods, billItems: initialBillItems = [] }: PayeeViewProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

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
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [qrModal, setQrModal] = useState<{ name: string; qrUrl: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [honestyItems, setHonestyItems] = useState<number[]>([0]);
  const [honestyConfirmed, setHonestyConfirmed] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [itemizedConfirmed, setItemizedConfirmed] = useState(false);
  const [currentBillItems, setCurrentBillItems] = useState<BillItem[]>(initialBillItems);
  const [popping, setPopping] = useState(false);
  const { proofFile, proofPreview, fileInputRef, handleProofSelect, resetProof } = useProofUpload();

  useEffect(() => {
    setHonestyItems([0]);
    setHonestyConfirmed(false);
    setSelectedItemIds(new Set());
    setItemizedConfirmed(false);
    resetProof();
    setProofUrl(null);
  }, [selectedMemberId, resetProof]);

  const isHonesty = bill.split_mode === "honesty";
  const isItemized = bill.split_mode === "itemized";
  const honestyAmount = honestyItems.reduce((s, v) => s + v, 0);
  const scPerPerson = calcScPerPerson(bill.service_charge_amount, members.length);
  const honestyTotal = honestyAmount + scPerPerson;
  const itemizedAmount = currentBillItems
    .filter((i) => selectedItemIds.has(i.id))
    .reduce((s, i) => s + i.amount, 0);
  const itemizedTotal = itemizedAmount + scPerPerson;

  const selectedMember = members.find((m) => m.id === selectedMemberId) ?? null;

  const date = new Date(bill.date).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  async function handleClaim() {
    if (!selectedMember || claiming) return;
    setClaiming(true);
    try {
      const result = await submitClaim({
        memberId: selectedMember.id,
        isItemized,
        isHonesty,
        selectedItemIds,
        honestyAmount,
        proofFile,
      });

      if (result.ok) {
        setClaimedIds((prev) => new Set(prev).add(selectedMember.id));
        if (result.data.proof_url) setProofUrl(result.data.proof_url as string);
        triggerPaymentCelebration();
        setPopping(true);
        setTimeout(() => setPopping(false), 400);
        setToastMsg("Payment sent!");
        try { localStorage.setItem(STORAGE_KEY(bill.id), selectedMember.id); } catch {}
      } else if (result.status === 409) {
        if (result.data.items) setCurrentBillItems(result.data.items as BillItem[]);
        setSelectedItemIds(new Set());
        setItemizedConfirmed(false);
        setToastMsg((result.data.error as string) ?? "Some items were already claimed. Please re-select.");
      } else {
        setToastMsg((result.data.error as string) ?? "Something went wrong. Please try again.");
      }
    } catch {
      setToastMsg("Network error. Please check your connection.");
    } finally {
      setClaiming(false);
    }
  }

  async function handleCopyAmount() {
    if (!selectedMember) return;
    let amount: number;
    if (isItemized && selectedMember.share_amount === 0) amount = itemizedTotal;
    else if (isHonesty && selectedMember.share_amount === 0) amount = honestyTotal;
    else amount = selectedMember.share_amount;
    const rounded = Math.round(amount * 100) / 100;
    await navigator.clipboard.writeText(String(rounded));
    setToastMsg("Amount copied!");
  }

  function toggleItem(itemId: string) {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
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

  const showPaymentSection = (!isHonesty && !isItemized) || hasClaimed || honestyConfirmed || itemizedConfirmed;

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

          {isItemized && !hasClaimed ? (
            <>
              {bill.receipt_url && (
                <ReceiptThumbnail src={bill.receipt_url} onClick={() => setReceiptOpen(true)} />
              )}

              {!itemizedConfirmed ? (
                <div className="share-card">
                  <p className="share-card-label">Select your items</p>
                  <div className="itemized-list">
                    {currentBillItems.map((item) => {
                      const claimedByOther = item.claimed_by && item.claimed_by !== selectedMember.id;
                      const claimerName = claimedByOther
                        ? members.find((m) => m.id === item.claimed_by)?.name ?? "Someone"
                        : null;
                      return (
                        <ItemizedItemCard
                          key={item.id}
                          name={item.name}
                          amount={item.amount}
                          isSelected={selectedItemIds.has(item.id)}
                          claimerName={claimerName}
                          onToggle={() => toggleItem(item.id)}
                        />
                      );
                    })}
                  </div>
                  {itemizedAmount > 0 && (
                    <AmountSummary
                      lines={[{ label: `Subtotal (${selectedItemIds.size} ${selectedItemIds.size === 1 ? "item" : "items"})`, amount: itemizedAmount }]}
                      scPerPerson={scPerPerson}
                      total={{ label: "Total", amount: itemizedTotal }}
                    />
                  )}
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={selectedItemIds.size === 0}
                    onClick={() => setItemizedConfirmed(true)}
                    style={{ marginTop: 16 }}
                  >
                    Confirm selection →
                  </button>
                </div>
              ) : (
                <div className="share-card">
                  <button
                    className="pay-back-btn"
                    style={{ marginBottom: 12 }}
                    onClick={() => setItemizedConfirmed(false)}
                  >
                    ← Edit selection
                  </button>
                  <p className="share-card-label">Your total</p>
                  <p className="share-amount">{formatCurrency(itemizedTotal)}</p>
                  <AmountSummary
                    lines={currentBillItems
                      .filter((i) => selectedItemIds.has(i.id))
                      .map((i) => ({ label: i.name, amount: i.amount }))}
                    scPerPerson={scPerPerson}
                    style={{ marginBottom: 12 }}
                  />
                  <button className="share-copy-btn" onClick={handleCopyAmount}>
                    Copy amount
                  </button>
                </div>
              )}
            </>
          ) : isHonesty && !hasClaimed ? (
            <>
              {bill.receipt_url && (
                <ReceiptThumbnail src={bill.receipt_url} onClick={() => setReceiptOpen(true)} />
              )}

              {!honestyConfirmed ? (
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
                    <AmountSummary
                      lines={[{ label: "Subtotal", amount: honestyAmount }]}
                      scPerPerson={scPerPerson}
                      total={{ label: "Total", amount: honestyTotal }}
                    />
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
                  <AmountSummary
                    lines={[{ label: "Subtotal", amount: honestyAmount }]}
                    scPerPerson={scPerPerson}
                    style={{ marginBottom: 12 }}
                  />
                  <button className="share-copy-btn" onClick={handleCopyAmount}>
                    Copy amount
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="share-card">
                <p className="share-card-label">Your share</p>
                <p className="share-amount">{formatCurrency(
                  isHonesty ? honestyTotal : isItemized ? itemizedTotal : selectedMember.share_amount
                )}</p>
                {scPerPerson > 0 && (() => {
                  const amount = isHonesty ? honestyTotal : isItemized ? itemizedTotal : selectedMember.share_amount;
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
