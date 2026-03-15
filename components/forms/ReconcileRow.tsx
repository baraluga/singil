import { formatCurrency } from "@/lib/utils/currency";

interface ReconcileRowProps {
  assigned: number;
  total: number;
}

export default function ReconcileRow({ assigned, total }: ReconcileRowProps) {
  const isBalanced = Math.abs(assigned - total) < 0.01;
  return (
    <div className="reconcile-row">
      <span className="reconcile-label">Total assigned</span>
      <span className={`reconcile-val${isBalanced ? "" : " unbalanced"}`}>
        {formatCurrency(assigned)} / {formatCurrency(total)}
      </span>
    </div>
  );
}
