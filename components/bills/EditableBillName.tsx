"use client";

import { useRef, useState, useTransition } from "react";
import { updateBillName } from "@/lib/actions/bills";

interface EditableBillNameProps {
  billId: string;
  name: string;
}

export default function EditableBillName({ billId, name }: EditableBillNameProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function startEditing() {
    setValue(name);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function save() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === name) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      await updateBillName(billId, trimmed);
      setEditing(false);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") save();
    if (e.key === "Escape") setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="editable-name-input bill-hero-name"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        disabled={isPending}
        autoFocus
      />
    );
  }

  return (
    <h1 className="bill-hero-name editable-name" onClick={startEditing} title="Click to edit">
      {name}
    </h1>
  );
}
