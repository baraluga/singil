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
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Receipt"
        className="max-w-full max-h-full rounded-xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="absolute bottom-6 text-white/40 text-xs">Tap anywhere to dismiss</div>
    </div>
  );
}
