import { SplitMode } from "@/lib/types";

interface SplitToggleProps {
  value: SplitMode;
  onChange: (mode: SplitMode) => void;
}

export default function SplitToggle({ value, onChange }: SplitToggleProps) {
  return (
    <div className="flex bg-border rounded-[10px] p-0.5 gap-0.5 mb-4">
      {(["equal", "manual"] as SplitMode[]).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold text-center capitalize transition-all ${
            value === mode
              ? "bg-surface text-ink shadow-sm"
              : "text-ink-muted"
          }`}
        >
          {mode === "equal" ? "Equal split" : "Manual"}
        </button>
      ))}
    </div>
  );
}
