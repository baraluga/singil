"use client";

import { useRef } from "react";

interface ReceiptUploadProps {
  preview: string | null;
  onChange: (file: File) => void;
}

export default function ReceiptUpload({ preview, onChange }: ReceiptUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onChange(file);
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="w-full h-20 bg-surface border-[1.5px] border-dashed border-border rounded-[10px] flex flex-col items-center justify-center gap-1 text-ink-muted text-xs cursor-pointer hover:border-accent transition-colors"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Receipt" className="h-full w-full object-cover rounded-[10px]" />
      ) : (
        <>
          <span className="text-xl">📷</span>
          <span>Tap to upload receipt</span>
        </>
      )}
    </div>
  );
}
