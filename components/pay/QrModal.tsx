"use client";

import { useEffect } from "react";

interface QrModalProps {
  methodName: string;
  qrUrl: string;
  onClose: () => void;
}

export default function QrModal({ methodName, qrUrl, onClose }: QrModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.9)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        gap: 20,
      }}
    >
      <p className="qr-modal-label">{methodName}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrUrl}
        alt={`${methodName} QR code`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "min(80vw, 400px)", maxHeight: "70vh", borderRadius: 12, objectFit: "contain" }}
      />
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Tap anywhere to dismiss</p>
    </div>
  );
}
