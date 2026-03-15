"use client";

import { useRef, useState, useTransition } from "react";
import { Member } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";
import { getShareBreakdown } from "@/lib/utils/split";
import { getAvatarColor, getInitial } from "@/lib/utils/avatars";
import { confirmPaid, dismissClaim, markPaid, updateMemberName } from "@/lib/actions/members";
import Modal from "@/components/ui/Modal";
import Toast from "@/components/ui/Toast";

interface MemberDetailRowProps {
  member: Member;
  scPct: number;
  index: number;
  billId: string;
}

export default function MemberDetailRow({ member, scPct, index, billId }: MemberDetailRowProps) {
  const colors = getAvatarColor(index);
  const hasAmount = member.share_amount > 0;
  const { food, sc } = getShareBreakdown(member.share_amount, scPct);
  const [proofOpen, setProofOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(member.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  function saveMemberName() {
    const trimmed = editNameValue.trim();
    if (!trimmed || trimmed === member.name) { setEditingName(false); return; }
    startTransition(async () => {
      await updateMemberName(member.id, trimmed, billId);
      setEditingName(false);
    });
  }

  function handleNameKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") saveMemberName();
    if (e.key === "Escape") setEditingName(false);
  }

  function runAction(action: () => Promise<void>, successMsg: string) {
    startTransition(async () => {
      await action();
      setToastMsg(successMsg);
    });
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <div className="member-detail-row">
        <div
          className="member-avatar"
          style={{ background: colors.bgValue, color: colors.textValue }}
        >
          {getInitial(member.name)}
        </div>
        <div className="member-detail-info">
          {!member.is_paid && editingName ? (
            <input
              ref={nameInputRef}
              className="editable-name-input"
              value={editNameValue}
              onChange={(e) => setEditNameValue(e.target.value)}
              onBlur={saveMemberName}
              onKeyDown={handleNameKeyDown}
              disabled={isPending}
              autoFocus
            />
          ) : (
            <div
              className={`member-detail-name${!member.is_paid ? " editable-name" : ""}`}
              onClick={() => { if (!member.is_paid) { setEditNameValue(member.name); setEditingName(true); } }}
              title={!member.is_paid ? "Click to edit" : undefined}
            >
              {member.name}
            </div>
          )}
          <div className="member-detail-sub">
            {hasAmount ? (
              <>{formatCurrency(food)} + {formatCurrency(sc)} SC{member.claimed_paid && !member.is_paid && " · claimed paid"}</>
            ) : (
              member.claimed_paid ? "Claimed — awaiting amount" : "Awaiting claim"
            )}
          </div>
        </div>
        <div className="member-detail-actions">
          <div className="member-detail-amount" style={!hasAmount ? { color: "var(--ink-muted)" } : undefined}>
            {hasAmount ? formatCurrency(member.share_amount) : "—"}
          </div>
          {member.is_paid ? (
            <span className="status-badge paid">✓ Paid</span>
          ) : member.claimed_paid ? (
            <span className="status-badge claimed">⚡ Claimed</span>
          ) : (
            <span className="status-badge pending">Pending</span>
          )}
        </div>
      </div>

      {!member.is_paid && (
        <div className="action-row">
          {member.claimed_paid ? (
            <>
              <button
                className="btn-mark confirm"
                disabled={isPending}
                onClick={() => runAction(() => confirmPaid(member.id, billId), "Payment confirmed!")}
              >
                ✓ Confirm
              </button>
              <button
                className="btn-mark"
                disabled={isPending}
                onClick={() => runAction(() => dismissClaim(member.id, billId), "Claim dismissed")}
              >
                ✗ Dismiss
              </button>
              {member.proof_url && (
                <button className="btn-mark" onClick={() => setProofOpen(true)}>
                  🧾 View proof
                </button>
              )}
            </>
          ) : (
            <button
              className="btn-mark confirm"
              disabled={isPending}
              onClick={() => runAction(() => markPaid(member.id, billId), "Marked as paid!")}
            >
              ✓ Mark paid
            </button>
          )}
        </div>
      )}

      {proofOpen && member.proof_url && (
        <Modal src={member.proof_url} onClose={() => setProofOpen(false)} />
      )}
      {toastMsg && <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />}
    </div>
  );
}
