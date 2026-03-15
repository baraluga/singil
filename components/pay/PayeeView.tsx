"use client";

import { useRef, useState } from "react";
import { Bill, Member, PaymentMethod } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";
import { getShareBreakdown } from "@/lib/utils/split";
import { getAvatarColor, getInitial } from "@/lib/utils/avatars";
import Modal from "@/components/ui/Modal";
import Toast from "@/components/ui/Toast";
import PaymentMethodCard from "@/components/pay/PaymentMethodCard";
import QrModal from "@/components/pay/QrModal";

interface PayeeViewProps {
  bill: Bill;
  members: Member[];
  paymentMethods: PaymentMethod[];
}

export default function PayeeView({ bill, members, paymentMethods }: PayeeViewProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [qrModal, setQrModal] = useState<{ name: string; qrUrl: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedMember = members.find((m) => m.id === selectedMemberId) ?? null;

  const date = new Date(bill.date).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  function handleProofSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  }

  async function handleClaim() {
    if (!selectedMember || claiming) return;
    setClaiming(true);
    try {
      let res: Response;
      if (proofFile) {
        const formData = new FormData();
        formData.append("file", proofFile);
        res = await fetch(`/api/members/${selectedMember.id}/claim`, {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch(`/api/members/${selectedMember.id}/claim`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      }
      if (res.ok) {
        const data = await res.json();
        setClaimedIds((prev) => new Set(prev).add(selectedMember.id));
        if (data.proof_url) setProofUrl(data.proof_url);
      }
    } finally {
      setClaiming(false);
    }
  }

  async function handleCopyAmount() {
    if (!selectedMember) return;
    await navigator.clipboard.writeText(formatCurrency(selectedMember.share_amount));
    setToastMsg("Amount copied!");
  }

  const hasClaimed = selectedMember
    ? selectedMember.claimed_paid || claimedIds.has(selectedMember.id)
    : false;
  const claimProofUrl = proofUrl || selectedMember?.proof_url || null;

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
          <button className="pay-back-btn" onClick={() => setSelectedMemberId(null)}>
            ← Oops, wrong person!
          </button>

          {/* Share card */}
          <div className="share-card">
            <p className="share-card-label">Your share</p>
            <p className="share-amount">{formatCurrency(selectedMember.share_amount)}</p>
            {(() => {
              const { food, sc } = getShareBreakdown(selectedMember.share_amount, bill.service_charge_pct);
              return (
                <p className="share-breakdown">
                  {formatCurrency(food)} food + {formatCurrency(sc)} SC ({bill.service_charge_pct}%)
                </p>
              );
            })()}
            <button className="share-copy-btn" onClick={handleCopyAmount}>
              Copy amount
            </button>
          </div>

          {/* Receipt link */}
          {bill.receipt_url && (
            <button className="receipt-link-btn" onClick={() => setReceiptOpen(true)}>
              🧾 View receipt
            </button>
          )}

          {/* Payment methods */}
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

          {/* CTA */}
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
                {/* Proof upload */}
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
              </>
            )}
          </div>
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
