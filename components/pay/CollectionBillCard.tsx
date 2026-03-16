"use client";

import { useState } from "react";
import { BillItem, BillWithMembers, Member, PaymentMethod } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";
import { calcScPerPerson } from "@/lib/utils/split";
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
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [qrModal, setQrModal] = useState<{ name: string; qrUrl: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [honestyItems, setHonestyItems] = useState<number[]>([0]);
  const [honestyConfirmed, setHonestyConfirmed] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [itemizedConfirmed, setItemizedConfirmed] = useState(false);
  const [currentBillItems, setCurrentBillItems] = useState<BillItem[]>(bill.items ?? []);
  const [popping, setPopping] = useState(false);
  const { proofFile, proofPreview, fileInputRef, handleProofSelect } = useProofUpload();

  const isHonesty = bill.split_mode === "honesty";
  const isItemized = bill.split_mode === "itemized";
  const honestyAmount = honestyItems.reduce((s, v) => s + v, 0);
  const scPerPerson = calcScPerPerson(bill.service_charge_amount, bill.members.length);
  const honestyTotal = honestyAmount + scPerPerson;
  const itemizedAmount = currentBillItems
    .filter((i) => selectedItemIds.has(i.id))
    .reduce((s, i) => s + i.amount, 0);
  const itemizedTotal = itemizedAmount + scPerPerson;

  const isPaid = member.is_paid;
  const hasClaimed = claimed || member.claimed_paid;
  const claimProofUrl = proofUrl || member.proof_url || null;
  const allItemsTaken = isItemized && currentBillItems.length > 0 && currentBillItems.every((i) => i.claimed_by && i.claimed_by !== member.id);
  const showPaymentSection = (!isHonesty && !isItemized) || hasClaimed || honestyConfirmed || itemizedConfirmed || allItemsTaken;

  const displayAmount = (isHonesty || isItemized) && member.share_amount === 0
    ? null
    : member.share_amount;

  const date = new Date(bill.date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });

  function getStatusChip() {
    if (isPaid) return <span className="bill-status-chip paid">✓ Paid</span>;
    if (hasClaimed) return <span className="bill-status-chip claimed">⏳ Claimed</span>;
    if ((isHonesty || isItemized) && member.share_amount === 0) return <span className="bill-status-chip pending">Awaiting</span>;
    return <span className="bill-status-chip pending">Unpaid</span>;
  }

  async function handleCopyAmount() {
    const amount = isItemized ? itemizedTotal : isHonesty ? honestyTotal : member.share_amount;
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

  async function handleClaim() {
    if (claiming) return;
    setClaiming(true);
    try {
      const result = await submitClaim({
        memberId: member.id,
        isItemized,
        isHonesty,
        selectedItemIds,
        honestyAmount,
        proofFile,
      });

      if (result.ok) {
        setClaimed(true);
        if (result.data.proof_url) setProofUrl(result.data.proof_url as string);
        triggerPaymentCelebration();
        setPopping(true);
        setTimeout(() => setPopping(false), 400);
        setToastMsg("Payment sent!");
        onClaimed(member.id);
        onToggle();
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

  return (
    <div className={`collection-bill-card${isExpanded ? " expanded" : ""}`}>
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
              {isItemized ? (
                <>
                  {bill.receipt_url && (
                    <ReceiptThumbnail src={bill.receipt_url} onClick={() => setReceiptOpen(true)} />
                  )}

                  {!itemizedConfirmed && !allItemsTaken ? (
                    <div className="share-card">
                      <p className="share-card-label">Select your items</p>
                      <div className="itemized-list">
                        {currentBillItems.map((item) => {
                          const claimedByOther = item.claimed_by && item.claimed_by !== member.id;
                          const claimerName = claimedByOther
                            ? bill.members.find((m) => m.id === item.claimed_by)?.name ?? "Someone"
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
                          lines={[{ label: "Subtotal", amount: itemizedAmount }]}
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
              ) : isHonesty ? (
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
                    <ProofUploadButton
                      proofPreview={proofPreview}
                      fileInputRef={fileInputRef}
                      onSelect={handleProofSelect}
                    />
                    <button
                      className={`btn-claim${popping ? " pop" : ""}`}
                      onClick={handleClaim}
                      disabled={!proofFile || claiming}
                      style={{ marginTop: 10 }}
                    >
                      {claiming ? "Sending..." : "Bayad na ako!"}
                    </button>
                    {!proofFile && <p className="proof-required-hint">Attach proof to continue</p>}
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
