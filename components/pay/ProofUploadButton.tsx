interface ProofUploadButtonProps {
  proofPreview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ProofUploadButton({ proofPreview, fileInputRef, onSelect }: ProofUploadButtonProps) {
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={onSelect}
      />
      {proofPreview ? (
        <button
          className="proof-attach-btn has-proof"
          onClick={() => fileInputRef.current?.click()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={proofPreview} alt="Proof preview" className="proof-preview-thumb" />
          <span>Change proof</span>
        </button>
      ) : (
        <button
          className="proof-attach-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          📎 Attach payment proof (optional)
        </button>
      )}
    </>
  );
}
