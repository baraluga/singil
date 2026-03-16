interface ClaimParams {
  memberId: string;
  isItemized: boolean;
  isHonesty: boolean;
  selectedItemIds: Set<string>;
  honestyAmount: number;
  proofFile: File | null;
}

interface ClaimResult {
  ok: boolean;
  status: number;
  data: Record<string, unknown>;
}

export async function submitClaim({
  memberId,
  isItemized,
  isHonesty,
  selectedItemIds,
  honestyAmount,
  proofFile,
}: ClaimParams): Promise<ClaimResult> {
  let res: Response;

  if (isItemized) {
    const endpoint = `/api/members/${memberId}/claim-items`;
    if (proofFile) {
      const formData = new FormData();
      formData.append("file", proofFile);
      formData.append("itemIds", JSON.stringify([...selectedItemIds]));
      res = await fetch(endpoint, { method: "POST", body: formData });
    } else {
      res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: [...selectedItemIds] }),
      });
    }
  } else if (proofFile) {
    const formData = new FormData();
    formData.append("file", proofFile);
    if (isHonesty) formData.append("amount", String(honestyAmount));
    res = await fetch(`/api/members/${memberId}/claim`, {
      method: "POST",
      body: formData,
    });
  } else {
    res = await fetch(`/api/members/${memberId}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isHonesty ? { amount: honestyAmount } : {}),
    });
  }

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
