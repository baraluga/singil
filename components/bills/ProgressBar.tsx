interface ProgressBarProps {
  paid: number;
  total: number;
}

export default function ProgressBar({ paid, total }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((paid / total) * 100);
  return (
    <div className="h-1 bg-border rounded-full overflow-hidden">
      <div
        className="h-full bg-green rounded-full"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
