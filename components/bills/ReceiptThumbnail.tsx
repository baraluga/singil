"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";

interface ReceiptThumbnailProps {
  url: string;
}

export default function ReceiptThumbnail({ url }: ReceiptThumbnailProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="absolute right-5 top-5 w-12 h-12 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-xl cursor-pointer"
      >
        🧾
      </button>
      {open && <Modal src={url} onClose={() => setOpen(false)} />}
    </>
  );
}
