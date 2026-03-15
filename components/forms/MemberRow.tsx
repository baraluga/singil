import { MemberInput, SplitMode } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";
import { getAvatarColor, getInitial } from "@/lib/utils/avatars";

interface MemberRowProps {
  member: MemberInput;
  index: number;
  splitMode: SplitMode;
  onNameChange: (tempId: string, name: string) => void;
  onRemove: (tempId: string) => void;
  canRemove: boolean;
}

export default function MemberRow({
  member,
  index,
  splitMode,
  onNameChange,
  onRemove,
  canRemove,
}: MemberRowProps) {
  const colors = getAvatarColor(index);

  return (
    <div className="member-row">
      <div
        className="member-avatar"
        style={{ background: colors.bgValue, color: colors.textValue }}
      >
        {getInitial(member.name) || String(index + 1)}
      </div>
      <input
        type="text"
        value={member.name}
        onChange={(e) => onNameChange(member.tempId, e.target.value)}
        placeholder={`Member ${index + 1}`}
        className="member-name-input"
      />
      {splitMode === "equal" && (
        <span className="member-amount">{formatCurrency(member.amount)}</span>
      )}
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(member.tempId)}
          className="member-remove-btn"
        >
          ✕
        </button>
      )}
    </div>
  );
}
