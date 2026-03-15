"use client";

import { Member } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";
import { getShareBreakdown } from "@/lib/utils/split";
import { getAvatarColor, getInitial } from "@/lib/utils/avatars";
import { confirmPaid, dismissClaim, markPaid } from "@/lib/actions/members";

interface MemberDetailRowProps {
  member: Member;
  scPct: number;
  index: number;
  billId: string;
}

export default function MemberDetailRow({ member, scPct, index, billId }: MemberDetailRowProps) {
  const colors = getAvatarColor(index);
  const { food, sc } = getShareBreakdown(member.share_amount, scPct);

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
          <div className="member-detail-name">{member.name}</div>
          <div className="member-detail-sub">
            {formatCurrency(food)} + {formatCurrency(sc)} SC
            {member.claimed_paid && !member.is_paid && " · claimed paid"}
          </div>
        </div>
        <div className="member-detail-actions">
          <div className="member-detail-amount">{formatCurrency(member.share_amount)}</div>
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
              <form action={confirmPaid.bind(null, member.id, billId)}>
                <button type="submit" className="btn-mark confirm">✓ Confirm</button>
              </form>
              <form action={dismissClaim.bind(null, member.id, billId)}>
                <button type="submit" className="btn-mark">✗ Dismiss</button>
              </form>
            </>
          ) : (
            <form action={markPaid.bind(null, member.id, billId)}>
              <button type="submit" className="btn-mark confirm">✓ Mark paid</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
