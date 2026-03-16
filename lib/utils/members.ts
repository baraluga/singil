import { BillWithMembers, Member } from "@/lib/types";

export function findMemberByName(name: string, bill: BillWithMembers): Member | null {
  return (
    bill.members.find(
      (m) => m.name.toLowerCase().trim() === name.toLowerCase().trim()
    ) ?? null
  );
}

export function extractUniqueNames(bills: BillWithMembers[]): string[] {
  const seen = new Map<string, string>();
  for (const bill of bills) {
    for (const member of bill.members) {
      const key = member.name.toLowerCase().trim();
      if (!seen.has(key)) seen.set(key, member.name.trim());
    }
  }
  return Array.from(seen.values());
}
