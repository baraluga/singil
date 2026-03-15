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
