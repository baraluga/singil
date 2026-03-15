import { Member } from "@/lib/types";

interface MemberChipProps {
  member: Pick<Member, "name" | "is_paid" | "claimed_paid">;
}

export default function MemberChip({ member }: MemberChipProps) {
  if (member.is_paid) {
    return <span className="member-chip paid">✓ {member.name}</span>;
  }
  if (member.claimed_paid) {
    return <span className="member-chip claimed">⚡ {member.name}</span>;
  }
  return <span className="member-chip pending">{member.name}</span>;
}
