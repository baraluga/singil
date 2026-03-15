"use client";

import { useState, useTransition } from "react";
import { settleBill } from "@/lib/actions/members";

export default function SettleButton({ billId }: { billId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await settleBill(billId);
    });
  }

  if (confirming) {
    return (
      <div style={{ marginTop: 16 }}>
        <p className="settle-confirm-msg">Are you sure? This cannot be undone.</p>
        <div className="settle-confirm-row">
          <button className="btn-green" onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Settling…" : "Yes, settle"}
          </button>
          <button className="btn-cancel" onClick={() => setConfirming(false)} disabled={isPending}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <button className="btn-green" onClick={() => setConfirming(true)}>
        ✓ Settle this bill
      </button>
    </div>
  );
}
