import { BillItemInput } from "@/lib/types";

interface ItemRowProps {
  item: BillItemInput;
  index: number;
  onNameChange: (tempId: string, name: string) => void;
  onAmountChange: (tempId: string, amount: number) => void;
  onRemove: (tempId: string) => void;
  canRemove: boolean;
}

export default function ItemRow({
  item,
  index,
  onNameChange,
  onAmountChange,
  onRemove,
  canRemove,
}: ItemRowProps) {
  return (
    <div className="item-entry-row">
      <span className="item-entry-num">{index + 1}</span>
      <input
        type="text"
        value={item.name}
        onChange={(e) => onNameChange(item.tempId, e.target.value)}
        placeholder="Item name"
        className="item-entry-name"
      />
      <div className="field-input-prefix item-entry-amount-wrap">
        <span className="prefix">₱</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.amount || ""}
          onChange={(e) => onAmountChange(item.tempId, parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          className="item-entry-amount"
        />
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(item.tempId)}
          className="item-entry-remove"
        >
          ✕
        </button>
      )}
    </div>
  );
}
