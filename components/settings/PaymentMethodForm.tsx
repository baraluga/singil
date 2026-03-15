"use client";

import { useRef, useState } from "react";
import { PaymentMethod } from "@/lib/types";
import { uploadQr, createPaymentMethod, updatePaymentMethod } from "@/lib/actions/payment-methods";

interface PaymentMethodFormProps {
  existing?: PaymentMethod;
  onSave: (method: PaymentMethod) => void;
  onCancel: () => void;
}

export default function PaymentMethodForm({ existing, onSave, onCancel }: PaymentMethodFormProps) {
  const [name, setName] = useState(existing?.name ?? "");
  const [qrPreview, setQrPreview] = useState<string | null>(existing?.qr_url ?? null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrFile(file);
    setQrPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError(null);
    try {
      let qrUrl = existing?.qr_url ?? null;

      if (qrFile) {
        const fd = new FormData();
        fd.append("file", qrFile);
        const result = await uploadQr(fd);
        if ("error" in result) { setError(result.error); return; }
        qrUrl = result.url;
      }

      const method = existing
        ? await updatePaymentMethod(existing.id, { name: name.trim(), qrUrl })
        : await createPaymentMethod({ name: name.trim(), qrUrl });

      onSave(method);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pm-form">
      <div className="field-group">
        <label className="field-label">Method name</label>
        <input
          className="field-input"
          placeholder="e.g. GCash, BPI"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="field-label">QR code image</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <div className="pm-qr-upload" onClick={() => fileInputRef.current?.click()}>
          {qrPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrPreview} alt="QR preview" />
          ) : (
            <>
              <span className="icon">📷</span>
              <span>Tap to upload QR code</span>
            </>
          )}
        </div>
        {qrPreview && (
          <button className="pm-qr-change" onClick={() => fileInputRef.current?.click()}>
            Change QR image
          </button>
        )}
      </div>

      {error && <p className="field-error">{error}</p>}

      <div className="pm-form-actions">
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : existing ? "Save changes" : "Add method"}
        </button>
        <button className="pm-cancel-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
