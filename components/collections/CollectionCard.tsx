import Link from "next/link";
import { CollectionWithBills } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";

interface CollectionCardProps {
  collection: CollectionWithBills;
}

export default function CollectionCard({ collection }: CollectionCardProps) {
  const billCount = collection.bills.length;
  const totalAmount = collection.bills.reduce((sum, b) => sum + b.total_amount, 0);
  const allMembers = collection.bills.flatMap((b) => b.members);
  const paidCount = allMembers.filter((m) => m.is_paid).length;
  const totalMembers = allMembers.length;

  const dates = collection.bills.map((b) => new Date(b.date)).sort((a, b) => +a - +b);
  const dateRange =
    dates.length === 0
      ? ""
      : dates.length === 1
      ? dates[0].toLocaleDateString("en-PH", { month: "short", day: "numeric" })
      : `${dates[0].toLocaleDateString("en-PH", { month: "short", day: "numeric" })} – ${dates[dates.length - 1].toLocaleDateString("en-PH", { month: "short", day: "numeric" })}`;

  return (
    <Link href={`/collections/${collection.id}`} className="collection-card">
      <div className="collection-card-top">
        <div>
          <div className="collection-card-name">{collection.name}</div>
          <div className="collection-card-meta">
            {billCount} {billCount === 1 ? "bill" : "bills"}
            {dateRange && ` · ${dateRange}`}
          </div>
        </div>
        <div className="collection-card-amount">{formatCurrency(totalAmount)}</div>
      </div>
      {totalMembers > 0 && (
        <div className="collection-card-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(paidCount / totalMembers) * 100}%` }}
            />
          </div>
          <div className="progress-label">
            <span>{paidCount} of {totalMembers} paid</span>
          </div>
        </div>
      )}
    </Link>
  );
}
