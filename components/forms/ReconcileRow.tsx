import { formatCurrency } from "@/lib/utils/currency";

interface ReconcileRowProps {
  assigned: number;
  total: number;
}

export default function ReconcileRow({ assigned, total }: ReconcileRowProps) {
  const isBalanced = Math.abs(assigned - total) < 0.01;
  return (
    <div className="flex justify-between items-center bg-accent-light rounded-[10px] px-3.5 py-2.5 mt-1 mb-4">
      <span className="text-xs text-accent font-medium">Total assigned</span>
      <span className={`text-sm font-bold ${isBalanced ? "text-accent" : "text-[#DC2626]"}`}>
        {formatCurrency(assigned)} / {formatCurrency(total)}
      </span>
    </div>
  );
}
