import Link from "next/link";
import { BillWithMembers } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";
import MemberChip from "./MemberChip";
import ProgressBar from "./ProgressBar";

interface BillCardProps {
  bill: BillWithMembers;
  settled?: boolean;
}

export default function BillCard({ bill, settled = false }: BillCardProps) {
  const paidCount = bill.members.filter((m) => m.is_paid).length;
  const totalCount = bill.members.length;
  const collected = bill.members.reduce((sum, m) => sum + (m.share_amount > 0 ? m.share_amount : 0), 0);
  const remaining = bill.total_amount - collected;

  const date = new Date(bill.date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/bills/${bill.id}`} className={`bill-card${settled ? " settled" : ""}`}>
      <div className="bill-card-top">
        <div>
          <div className="bill-name">{bill.name}</div>
          <div className="bill-date">
            {date} · {totalCount} {totalCount === 1 ? "person" : "people"}
          </div>
        </div>
        <div>
          <div className="bill-amount">{formatCurrency(bill.total_amount)}</div>
          <span className="bill-amount-label">{settled ? "settled ✓" : "total"}</span>
        </div>
      </div>

      {settled ? (
        <div className="members-row">
          <MemberChip member={{ ...bill.members[0], is_paid: true, name: "All paid" }} />
        </div>
      ) : (
        <>
          <ProgressBar paid={paidCount} total={totalCount} />
          <div className="progress-label">
            <span>{paidCount} of {totalCount} paid</span>
            <span>{formatCurrency(remaining)} remaining</span>
          </div>
          <div className="members-row">
            {bill.members.map((m) => (
              <MemberChip key={m.id} member={m} />
            ))}
          </div>
        </>
      )}
    </Link>
  );
}
