"use client";

import { PaymentMethod } from "@/lib/types";

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onTap?: () => void;
}

export default function PaymentMethodCard({ method, onTap }: PaymentMethodCardProps) {
  return (
    <button
      className={`payment-card${onTap ? "" : " no-qr"}`}
      onClick={onTap}
      disabled={!onTap}
    >
      <div className="payment-card-info">
        <span className="payment-card-name">{method.name}</span>
        {onTap && <span className="payment-card-hint">Tap to view QR</span>}
      </div>
      {onTap && <span className="payment-card-arrow">→</span>}
    </button>
  );
}
