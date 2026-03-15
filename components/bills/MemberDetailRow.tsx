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
    <div className="mb-2">
      <div className="bg-surface border border-border rounded-xl px-4 py-3.5 flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${colors.bg} ${colors.text}`}
        >
          {getInitial(member.name)}
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-ink">{member.name}</div>
          <div className="text-xs text-ink-muted mt-0.5">
            {formatCurrency(food)} + {formatCurrency(sc)} SC
            {member.claimed_paid && !member.is_paid && " · claimed paid"}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="font-serif text-[18px] text-ink">{formatCurrency(member.share_amount)}</div>
          {member.is_paid ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-light text-green">
              ✓ Paid
            </span>
          ) : member.claimed_paid ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E]">
              ⚡ Claimed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-bg text-ink-muted border border-border">
              Pending
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {!member.is_paid && (
        <div className="flex gap-2 mt-1 pl-[52px]">
          {member.claimed_paid ? (
            <>
              <form action={confirmPaid.bind(null, member.id, billId)}>
                <button
                  type="submit"
                  className="bg-none border border-green rounded-lg px-2.5 py-1 text-[11px] font-semibold text-green"
                >
                  ✓ Confirm
                </button>
              </form>
              <form action={dismissClaim.bind(null, member.id, billId)}>
                <button
                  type="submit"
                  className="bg-none border border-border rounded-lg px-2.5 py-1 text-[11px] font-semibold text-ink-muted"
                >
                  ✗ Dismiss
                </button>
              </form>
            </>
          ) : (
            <form action={markPaid.bind(null, member.id, billId)}>
              <button
                type="submit"
                className="bg-none border border-green rounded-lg px-2.5 py-1 text-[11px] font-semibold text-green"
              >
                ✓ Mark paid
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
