import { formatCurrency } from "@/lib/utils/currency";

interface ItemizedItemCardProps {
  name: string;
  amount: number;
  isSelected: boolean;
  claimerName: string | null;
  onToggle: () => void;
}

export default function ItemizedItemCard({
  name,
  amount,
  isSelected,
  claimerName,
  onToggle,
}: ItemizedItemCardProps) {
  const disabled = !!claimerName;
  return (
    <button
      type="button"
      className={`itemized-item${isSelected ? " selected" : ""}${disabled ? " claimed" : ""}`}
      onClick={() => { if (!disabled) onToggle(); }}
      disabled={disabled}
    >
      <span className="itemized-check">{isSelected ? "✓" : ""}</span>
      <span className="itemized-item-name">{name}</span>
      <span className="itemized-item-amount">{formatCurrency(amount)}</span>
      {claimerName && (
        <span className="itemized-item-claimed-by">{claimerName}</span>
      )}
    </button>
  );
}
