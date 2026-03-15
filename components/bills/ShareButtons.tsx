"use client";

import { useState } from "react";
import Toast from "@/components/ui/Toast";

interface ShareButtonsProps {
  billId: string;
  billName: string;
}

export default function ShareButtons({ billId, billName }: ShareButtonsProps) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  function getUrl() {
    return `${window.location.origin}/pay/${billId}`;
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(getUrl());
    setToastMsg("Link copied!");
  }

  async function handleShare() {
    const url = getUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title: "Singil", text: `Pay your share for ${billName}`, url });
      } catch {
        // User cancelled share — ignore
      }
    } else {
      await navigator.clipboard.writeText(url);
      setToastMsg("Link copied!");
    }
  }

  return (
    <>
      <div className="share-row">
        <button onClick={handleCopy} className="btn-share">
          🔗 Copy link
        </button>
        <button onClick={handleShare} className="btn-share primary">
          Share to group →
        </button>
      </div>
      {toastMsg && <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />}
    </>
  );
}
