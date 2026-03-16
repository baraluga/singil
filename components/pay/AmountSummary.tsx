import { formatCurrency } from "@/lib/utils/currency";

interface SummaryLine {
  label: string;
  amount: number;
}

interface AmountSummaryProps {
  lines: SummaryLine[];
  scPerPerson?: number;
  total?: { label: string; amount: number };
  style?: React.CSSProperties;
}

export default function AmountSummary({ lines, scPerPerson, total, style }: AmountSummaryProps) {
  return (
    <div className="amount-summary" style={style}>
      {lines.map((line, i) => (
        <div key={i} className="amount-summary-row">
          <span>{line.label}</span>
          <span>{formatCurrency(line.amount)}</span>
        </div>
      ))}
      {scPerPerson != null && scPerPerson > 0 && (
        <div className="amount-summary-row sc">
          <span>SC (split equally)</span>
          <span>+{formatCurrency(scPerPerson)}</span>
        </div>
      )}
      {total && (
        <div className="amount-summary-row total">
          <span>{total.label}</span>
          <span>{formatCurrency(total.amount)}</span>
        </div>
      )}
    </div>
  );
}
