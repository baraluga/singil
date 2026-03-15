"use client";

import { useTransition } from "react";
import { deleteCollection } from "@/lib/actions/collections";

export default function DeleteCollectionButton({ collectionId }: { collectionId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this collection? The individual bills won't be affected.")) return;
    startTransition(() => deleteCollection(collectionId));
  }

  return (
    <button
      className="btn-mark"
      onClick={handleDelete}
      disabled={isPending}
      style={{ color: "#DC2626" }}
    >
      {isPending ? "Deleting…" : "Delete collection"}
    </button>
  );
}
