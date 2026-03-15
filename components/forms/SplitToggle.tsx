import { SplitMode } from "@/lib/types";

interface SplitToggleProps {
  value: SplitMode;
  onChange: (mode: SplitMode) => void;
}

export default function SplitToggle({ value, onChange }: SplitToggleProps) {
  return (
    <div className="split-toggle">
      {(["equal", "manual"] as SplitMode[]).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={`split-opt${value === mode ? " active" : ""}`}
        >
          {mode === "equal" ? "Equal split" : "Manual"}
        </button>
      ))}
    </div>
  );
}
