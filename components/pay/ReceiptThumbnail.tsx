interface ReceiptThumbnailProps {
  src: string;
  onClick: () => void;
}

export default function ReceiptThumbnail({ src, onClick }: ReceiptThumbnailProps) {
  return (
    <button
      className="receipt-thumbnail-btn"
      onClick={onClick}
      aria-label="View receipt"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Receipt" className="receipt-thumbnail-img" />
      <span className="receipt-thumbnail-overlay">🔍 Tap to expand</span>
    </button>
  );
}
