import { MemberInput, SplitMode } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";
import { getAvatarColor, getInitial } from "@/lib/utils/avatars";

interface MemberRowProps {
  member: MemberInput;
  index: number;
  splitMode: SplitMode;
  onNameChange: (tempId: string, name: string) => void;
  onAmountChange: (tempId: string, amount: number) => void;
  onRemove: (tempId: string) => void;
  canRemove: boolean;
}

export default function MemberRow({
  member,
  index,
  splitMode,
  onNameChange,
  onAmountChange,
  onRemove,
  canRemove,
}: MemberRowProps) {
  const colors = getAvatarColor(index);

  return (
    <div className="flex items-center gap-2.5 bg-surface border border-border rounded-[10px] px-3 py-2.5">
      <div
        className={`w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${colors.bg} ${colors.text}`}
      >
        {getInitial(member.name) || String(index + 1)}
      </div>
      <input
        type="text"
        value={member.name}
        onChange={(e) => onNameChange(member.tempId, e.target.value)}
        placeholder={`Member ${index + 1}`}
        className="flex-1 bg-transparent text-sm font-medium text-ink outline-none placeholder-[#BEB5A8]"
      />
      {splitMode === "equal" ? (
        <span className="text-sm font-semibold text-ink">{formatCurrency(member.amount)}</span>
      ) : (
        <input
          type="number"
          value={member.amount || ""}
          onChange={(e) => onAmountChange(member.tempId, parseFloat(e.target.value) || 0)}
          placeholder="0"
          className="w-24 bg-accent-light text-accent text-[13px] font-semibold text-right rounded-[8px] px-2.5 py-1.5 outline-none border-none"
        />
      )}
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(member.tempId)}
          className="text-ink-muted hover:text-[#DC2626] text-sm ml-1"
        >
          ✕
        </button>
      )}
    </div>
  );
}
