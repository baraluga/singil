"use client";

import { useRef } from "react";
import { compressImage } from "@/lib/utils/image";

interface ReceiptUploadProps {
  preview: string | null;
  onChange: (file: File) => void;
}

export default function ReceiptUpload({ preview, onChange }: ReceiptUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    onChange(compressed);
  }

  return (
    <div className="receipt-upload" onClick={() => inputRef.current?.click()}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={handleChange}
      />
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Receipt" />
      ) : (
        <>
          <span className="icon">📷</span>
          <span>Tap to upload receipt</span>
        </>
      )}
    </div>
  );
}
