import { Member } from "@/lib/types";

interface MemberChipProps {
  member: Member;
}

export default function MemberChip({ member }: MemberChipProps) {
  if (member.is_paid) {
    return (
      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-light text-green">
        ✓ {member.name}
      </span>
    );
  }
  if (member.claimed_paid) {
    return (
      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E]">
        ⚡ {member.name}
      </span>
    );
  }
  return (
    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-bg text-ink-muted border border-border">
      {member.name}
    </span>
  );
}
