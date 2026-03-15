/**
 * SC is split equally among members + the bill owner (N+1).
 * memberCount is the number of payee members (excluding the owner).
 */
export function calcScPerPerson(scAmount: number, memberCount: number): number {
  return scAmount / Math.max(memberCount + 1, 1);
}

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
