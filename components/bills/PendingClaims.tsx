"use client";

import { useState, useTransition } from "react";
import { BillWithMembers, Member } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";
import { getAvatarColor, getInitial } from "@/lib/utils/avatars";
import { confirmPaid, dismissClaim } from "@/lib/actions/members";
import Modal from "@/components/ui/Modal";
import Toast from "@/components/ui/Toast";

interface PendingClaimsProps {
  activeBills: BillWithMembers[];
}

interface PendingClaim {
  member: Member;
  billName: string;
}

export default function PendingClaims({ activeBills }: PendingClaimsProps) {
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const claims: PendingClaim[] = activeBills.flatMap((bill) =>
    bill.members
      .filter((m) => m.claimed_paid && !m.is_paid)
      .map((m) => ({ member: m, billName: bill.name }))
  );

  if (claims.length === 0) return null;

  function runAction(memberId: string, billId: string, action: () => Promise<void>, msg: string) {
    setActioningId(memberId);
    startTransition(async () => {
      await action();
      setActioningId(null);
      setToastMsg(msg);
    });
  }

  return (
    <div className="pending-claims">
      <div className="pending-claims-title">
        Pending Claims <span className="pending-claims-count">{claims.length}</span>
      </div>

      {claims.map(({ member, billName }, i) => {
        const colors = getAvatarColor(i);
        const busy = isPending && actioningId === member.id;

        return (
          <div key={member.id} className="pending-claim-row">
            <div
              className="member-avatar"
              style={{ background: colors.bgValue, color: colors.textValue, width: 32, height: 32, fontSize: 13 }}
            >
              {getInitial(member.name)}
            </div>

            <div className="pending-claim-info">
              <div className="pending-claim-name">{member.name}</div>
              <div className="pending-claim-sub">
                {billName} · {member.share_amount > 0 ? formatCurrency(member.share_amount) : "awaiting amount"}
              </div>
            </div>

            {member.proof_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={member.proof_url}
                alt="Proof"
                className="pending-claim-proof"
                onClick={() => setProofUrl(member.proof_url)}
              />
            )}

            <div className="pending-claim-actions">
              <button
                className="btn-mark confirm"
                disabled={busy}
                onClick={() => runAction(member.id, member.bill_id, () => confirmPaid(member.id, member.bill_id), "Payment confirmed!")}
              >
                ✓
              </button>
              <button
                className="btn-mark"
                disabled={busy}
                onClick={() => runAction(member.id, member.bill_id, () => dismissClaim(member.id, member.bill_id), "Claim dismissed")}
              >
                ✗
              </button>
            </div>
          </div>
        );
      })}

      {proofUrl && <Modal src={proofUrl} onClose={() => setProofUrl(null)} />}
      {toastMsg && <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />}
    </div>
  );
}
