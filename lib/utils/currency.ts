export function formatCurrency(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  if (rounded % 1 === 0) {
    return `₱${rounded.toLocaleString("en-PH")}`;
  }
  return `₱${rounded.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function parseCurrency(input: string): number {
  const cleaned = input.replace(/[₱,\s]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
