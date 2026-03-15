"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BillWithMembers } from "@/lib/types";
import { createCollection } from "@/lib/actions/collections";

interface NewCollectionFormProps {
  bills: BillWithMembers[];
}

export default function NewCollectionForm({ bills }: NewCollectionFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Collection name is required");
    if (selected.size < 2) return setError("Select at least 2 bills");

    startTransition(async () => {
      const result = await createCollection({ name: name.trim(), billIds: Array.from(selected) });
      if ("error" in result) {
        setError(result.error);
      } else {
        router.push(`/collections/${result.id}`);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field-group">
        <label className="field-label">Collection Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Weekend trips with college barkada"
          className="field-input"
        />
      </div>

      <div className="field-label" style={{ marginBottom: 8 }}>Select Bills</div>
      {bills.length === 0 ? (
        <p style={{ color: "var(--ink-muted)", fontSize: 14, marginBottom: 16 }}>
          No active bills yet. <Link href="/bills/new">Create one first.</Link>
        </p>
      ) : (
        <div className="bill-selector" style={{ marginBottom: 16 }}>
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
                    {date} · {bill.members.length} people
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="field-error">{error}</p>}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "Creating…" : "Create Collection & Get Link →"}
      </button>
    </form>
  );
}
