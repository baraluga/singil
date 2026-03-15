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
  const remaining = bill.members
    .filter((m) => !m.is_paid)
    .reduce((sum, m) => sum + m.share_amount, 0);

  const date = new Date(bill.date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });

  return (
    <Link
      href={`/bills/${bill.id}`}
      className={`block bg-surface border border-border rounded-2xl p-4 mb-2.5 shadow-md ${settled ? "opacity-60" : ""}`}
    >
      <div className="flex justify-between items-start mb-2.5">
        <div>
          <div className="font-semibold text-[15px] text-ink">{bill.name}</div>
          <div className="text-xs text-ink-muted mt-0.5">
            {date} · {totalCount} {totalCount === 1 ? "person" : "people"}
          </div>
        </div>
        <div className="text-right">
          <div className="font-serif text-xl text-ink">{formatCurrency(bill.total_amount)}</div>
          <div className="text-xs text-ink-muted mt-0.5">{settled ? "settled ✓" : "total"}</div>
        </div>
      </div>

      {settled ? (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          <MemberChip member={{ ...bill.members[0], is_paid: true, name: "All paid" }} />
        </div>
      ) : (
        <>
          <ProgressBar paid={paidCount} total={totalCount} />
          <div className="flex justify-between text-[11px] text-ink-muted mt-2 mb-2.5">
            <span>{paidCount} of {totalCount} paid</span>
            <span>{formatCurrency(remaining)} remaining</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {bill.members.map((m) => (
              <MemberChip key={m.id} member={m} />
            ))}
          </div>
        </>
      )}
    </Link>
  );
}
