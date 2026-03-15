"use client";

import { useState } from "react";
import { PaymentMethod } from "@/lib/types";
import { deletePaymentMethod, reorderPaymentMethod } from "@/lib/actions/payment-methods";
import PaymentMethodForm from "@/components/settings/PaymentMethodForm";
import Modal from "@/components/ui/Modal";

interface PaymentMethodsManagerProps {
  initialMethods: PaymentMethod[];
}

export default function PaymentMethodsManager({ initialMethods }: PaymentMethodsManagerProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>(initialMethods);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  function handleSaved(method: PaymentMethod) {
    if (editingId) {
      setMethods((prev) => prev.map((m) => (m.id === method.id ? method : m)));
      setEditingId(null);
    } else {
      setMethods((prev) => [...prev, method]);
      setShowAddForm(false);
    }
  }

  async function handleDelete(id: string) {
    setMethods((prev) => prev.filter((m) => m.id !== id));
    await deletePaymentMethod(id);
  }

  async function handleReorder(id: string, direction: "up" | "down") {
    const ids = methods.map((m) => m.id);
    const idx = ids.indexOf(id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= methods.length) return;

    // Optimistic reorder
    const next = [...methods];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setMethods(next);

    await reorderPaymentMethod(id, direction, ids);
  }

  return (
    <div>
      {methods.length === 0 && !showAddForm ? (
        <div className="empty-state">
          <div className="empty-state-icon">💳</div>
          <p className="empty-state-title">No payment methods yet</p>
          <p className="empty-state-sub">Add your GCash or bank QR so payees can send you money.</p>
        </div>
      ) : (
        methods.map((method, i) =>
          editingId === method.id ? (
            <div key={method.id} style={{ marginBottom: 12 }}>
              <PaymentMethodForm
                existing={method}
                onSave={handleSaved}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div key={method.id} className="pm-card">
              <div className="pm-card-left">
                {method.qr_url ? (
                  <button className="pm-card-thumb" onClick={() => setQrPreview(method.qr_url)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={method.qr_url} alt={`${method.name} QR`} />
                  </button>
                ) : (
                  <div className="pm-card-thumb no-qr">QR</div>
                )}
                <span className="pm-card-name">{method.name}</span>
              </div>
              <div className="pm-card-actions">
                <div className="pm-reorder-btns">
                  <button
                    className="btn-reorder"
                    onClick={() => handleReorder(method.id, "up")}
                    disabled={i === 0}
                    aria-label="Move up"
                  >▲</button>
                  <button
                    className="btn-reorder"
                    onClick={() => handleReorder(method.id, "down")}
                    disabled={i === methods.length - 1}
                    aria-label="Move down"
                  >▼</button>
                </div>
                <button className="btn-mark confirm" onClick={() => setEditingId(method.id)}>Edit</button>
                <button className="btn-mark" onClick={() => handleDelete(method.id)}>Delete</button>
              </div>
            </div>
          )
        )
      )}

      {showAddForm ? (
        <div style={{ marginTop: 16 }}>
          <PaymentMethodForm
            onSave={handleSaved}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      ) : (
        !editingId && (
          <button
            className="add-member-btn"
            style={{ marginTop: 16 }}
            onClick={() => setShowAddForm(true)}
          >
            + Add payment method
          </button>
        )
      )}

      {qrPreview && <Modal src={qrPreview} onClose={() => setQrPreview(null)} />}
    </div>
  );
}
