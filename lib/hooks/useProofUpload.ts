"use client";

import { useCallback, useRef, useState } from "react";
import { compressImage } from "@/lib/utils/image";

export function useProofUpload() {
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleProofSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofPreview(URL.createObjectURL(file));
    const compressed = await compressImage(file);
    setProofFile(compressed);
  }

  const resetProof = useCallback(() => {
    setProofFile(null);
    setProofPreview(null);
  }, []);

  return {
    proofFile,
    proofPreview,
    fileInputRef,
    handleProofSelect,
    resetProof,
  };
}
