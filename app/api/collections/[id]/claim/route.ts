import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { calcScPerPerson } from "@/lib/utils/split";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

interface ClaimEntry {
  memberId: string;
  amount?: number; // food amount, required for honesty-mode members
  itemIds?: string[]; // item IDs, required for itemized-mode members
}

interface MemberRow {
  id: string;
  is_paid: boolean;
  claimed_paid: boolean;
  bill_id: string;
  share_amount: number;
}

interface BillRow {
  id: string;
  split_mode: string;
  service_charge_amount: number;
  total_amount: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params; // collectionId not needed for processing, but required by Next.js

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const formData = await request.formData();

  // Parse claims payload
  const claimsRaw = formData.get("claims");
  if (!claimsRaw) {
    return NextResponse.json({ error: "Missing claims payload" }, { status: 400 });
  }

  let claims: ClaimEntry[];
  try {
    claims = JSON.parse(String(claimsRaw));
    if (!Array.isArray(claims) || claims.length === 0) throw new Error();
  } catch {
    return NextResponse.json({ error: "Invalid claims payload" }, { status: 400 });
  }

  // Upload proof file once (if provided)
  let proof_url: string | null = null;
  const file = formData.get("file") as File | null;
  if (file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `proof_batch_${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("receipts")
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage.from("receipts").getPublicUrl(uploadData.path);
    proof_url = urlData.publicUrl;
  }

  // Fetch all member info
  const memberIds = claims.map((c) => c.memberId);
  const { data: membersRaw, error: membersError } = await supabaseAdmin
    .from("members")
    .select("id, is_paid, claimed_paid, bill_id, share_amount")
    .in("id", memberIds);

  if (membersError || !membersRaw) {
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }

  const members = membersRaw as MemberRow[];
  const billIds = [...new Set(members.map((m) => m.bill_id))];

  // Fetch bill info
  const { data: billsRaw } = await supabaseAdmin
    .from("bills")
    .select("id, split_mode, service_charge_amount, total_amount")
    .in("id", billIds);

  const bills = (billsRaw ?? []) as BillRow[];
  const billMap = new Map<string, BillRow>(bills.map((b) => [b.id, b]));

  // Count members per bill
  const memberCountMap = new Map<string, number>();
  await Promise.all(
    billIds.map(async (billId) => {
      const { count } = await supabaseAdmin
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("bill_id", billId);
      memberCountMap.set(billId, count ?? 0);
    })
  );

  // Build update payloads
  const updates: Array<{ id: string; payload: Record<string, unknown> }> = [];
  for (const claim of claims) {
    const member = members.find((m) => m.id === claim.memberId);
    if (!member) continue;
    // Skip already paid/claimed
    if (member.is_paid || member.claimed_paid) continue;

    const bill = billMap.get(member.bill_id);
    if (!bill) continue;

    const isHonesty = bill.split_mode === "honesty";
    const isItemized = bill.split_mode === "itemized";
    const payload: Record<string, unknown> = { claimed_paid: true };
    if (proof_url) payload.proof_url = proof_url;

    if (isItemized) {
      const itemIds = claim.itemIds ?? [];
      if (itemIds.length === 0) {
        return NextResponse.json(
          { error: `No items selected for member ${claim.memberId}` },
          { status: 400 }
        );
      }

      const { data: claimedItems, error: claimErr } = await supabaseAdmin
        .from("bill_items")
        .update({ claimed_by: claim.memberId })
        .eq("bill_id", member.bill_id)
        .in("id", itemIds)
        .is("claimed_by", null)
        .select("id, amount");

      if (claimErr) {
        return NextResponse.json({ error: claimErr.message }, { status: 500 });
      }

      if (!claimedItems || claimedItems.length < itemIds.length) {
        if (claimedItems?.length) {
          await supabaseAdmin
            .from("bill_items")
            .update({ claimed_by: null })
            .in("id", claimedItems.map((i) => i.id));
        }
        return NextResponse.json(
          { error: "Some items were already claimed" },
          { status: 409 }
        );
      }

      const foodAmount = claimedItems.reduce((sum, item) => sum + Number(item.amount), 0);
      const memberCount = memberCountMap.get(member.bill_id) ?? 0;
      const scPerPerson = calcScPerPerson(bill.service_charge_amount, memberCount);
      payload.share_amount = Math.round((foodAmount + scPerPerson) * 100) / 100;
    } else if (isHonesty) {
      const foodAmount = claim.amount ?? 0;
      if (foodAmount <= 0) {
        return NextResponse.json(
          { error: `Honesty amount required for member ${claim.memberId}` },
          { status: 400 }
        );
      }
      if (foodAmount > bill.total_amount) {
        return NextResponse.json(
          { error: `Amount exceeds bill total for member ${claim.memberId}` },
          { status: 400 }
        );
      }
      const memberCount = memberCountMap.get(member.bill_id) ?? 0;
      const scPerPerson = calcScPerPerson(bill.service_charge_amount, memberCount);
      payload.share_amount = Math.round((foodAmount + scPerPerson) * 100) / 100;
    }

    updates.push({ id: claim.memberId, payload });
  }

  // Apply all updates
  const errors: string[] = [];
  await Promise.all(
    updates.map(async ({ id, payload }) => {
      const { error } = await supabaseAdmin.from("members").update(payload).eq("id", id);
      if (error) errors.push(error.message);
    })
  );

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 500 });
  }

  return NextResponse.json({ ok: true, proof_url });
}
