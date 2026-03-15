"use client";

import { useEffect } from "react";

interface ModalProps {
  src: string;
  onClose: () => void;
}

export default function Modal({ src, onClose }: ModalProps) {
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
        background: "rgba(0,0,0,0.7)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Receipt"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12, objectFit: "contain" }}
      />
      <div style={{ position: "absolute", bottom: 24, color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
        Tap anywhere to dismiss
      </div>
    </div>
  );
}
