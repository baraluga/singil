interface ProgressBarProps {
  paid: number;
  total: number;
}

export default function ProgressBar({ paid, total }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((paid / total) * 100);
  return (
    <div className="progress-bar-wrap">
      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
