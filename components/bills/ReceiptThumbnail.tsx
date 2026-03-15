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
      <button onClick={() => setOpen(true)} className="receipt-thumb">
        🧾
      </button>
      {open && <Modal src={url} onClose={() => setOpen(false)} />}
    </>
  );
}
