"use client";

import { useState } from "react";
import { BillWithMembers } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";

interface BillSelectorProps {
  bills: BillWithMembers[];
  initialSelected?: string[];
  name?: string; // form field name
}

export default function BillSelector({
  bills,
  initialSelected = [],
  name = "billIds",
}: BillSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="bill-selector">
      {bills.map((bill) => {
        const isSelected = selected.has(bill.id);
        const date = new Date(bill.date).toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
        });
        return (
          <button
            key={bill.id}
            type="button"
            className={`bill-selector-item${isSelected ? " selected" : ""}`}
            onClick={() => toggle(bill.id)}
          >
            <div className="bill-selector-check">{isSelected ? "✓" : ""}</div>
            <div className="bill-selector-info">
              <span className="bill-selector-name">{bill.name}</span>
              <span className="bill-selector-meta">
                {date} · {bill.members.length} people · {formatCurrency(bill.total_amount)}
              </span>
            </div>
          </button>
        );
      })}
      {/* Hidden inputs for form submission */}
      {Array.from(selected).map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
    </div>
  );
}
