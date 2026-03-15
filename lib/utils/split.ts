/**
 * Splits a grand total (SC-inclusive) equally among members.
 * Remainder cents go to the first member.
 */
export function calculateEqualSplit(totalAmount: number, memberCount: number): number[] {
  if (memberCount === 0) return [];
  const totalCents = Math.round(totalAmount * 100);
  const perPersonCents = Math.floor(totalCents / memberCount);
  const remainderCents = totalCents - perPersonCents * memberCount;

  return Array.from({ length: memberCount }, (_, i) => {
    const cents = i === 0 ? perPersonCents + remainderCents : perPersonCents;
    return cents / 100;
  });
}

/**
 * Back-calculates food and SC breakdown for display purposes.
 * The share_amount stored in DB is the grand total per member (food + SC).
 */
export function getShareBreakdown(shareAmount: number, scPct: number): { food: number; sc: number } {
  if (scPct === 0) return { food: shareAmount, sc: 0 };
  const food = Math.round(shareAmount / (1 + scPct / 100));
  const sc = shareAmount - food;
  return { food, sc };
}
