import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { calcScPerPerson } from "@/lib/utils/split";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: member, error: fetchError } = await supabaseAdmin
    .from("members")
    .select("id, is_paid, claimed_paid, bill_id")
    .eq("id", id)
    .single();

  if (fetchError || !member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (member.is_paid) {
    return NextResponse.json({ ok: true, alreadyPaid: true });
  }

  const [{ data: bill }, { count: memberCount }] = await Promise.all([
    supabaseAdmin
      .from("bills")
      .select("split_mode, service_charge_amount, total_amount")
      .eq("id", member.bill_id)
      .single(),
    supabaseAdmin
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("bill_id", member.bill_id),
  ]);

  if (bill?.split_mode !== "itemized") {
    return NextResponse.json({ error: "Bill is not in itemized mode" }, { status: 400 });
  }

  let proof_url: string | null = null;
  let itemIds: string[] = [];

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const itemIdsRaw = formData.get("itemIds");
    if (itemIdsRaw) itemIds = JSON.parse(String(itemIdsRaw));

    if (file) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });
      }

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `proof_${id}_${Date.now()}.${ext}`;
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
  } else {
    const body = await request.json().catch(() => ({}));
    if (body.itemIds) itemIds = body.itemIds;
  }

  if (!itemIds.length) {
    return NextResponse.json({ error: "No items selected" }, { status: 400 });
  }

  const { data: claimedItems, error: claimError } = await supabaseAdmin
    .from("bill_items")
    .update({ claimed_by: id })
    .eq("bill_id", member.bill_id)
    .in("id", itemIds)
    .is("claimed_by", null)
    .select("id, amount");

  if (claimError) {
    return NextResponse.json({ error: claimError.message }, { status: 500 });
  }

  if (!claimedItems || claimedItems.length < itemIds.length) {
    if (claimedItems?.length) {
      await supabaseAdmin
        .from("bill_items")
        .update({ claimed_by: null })
        .in("id", claimedItems.map((i) => i.id));
    }

    const { data: currentItems } = await supabaseAdmin
      .from("bill_items")
      .select("id, name, amount, claimed_by")
      .eq("bill_id", member.bill_id)
      .order("created_at");

    return NextResponse.json(
      { error: "Some items were already claimed", items: currentItems },
      { status: 409 }
    );
  }

  const foodAmount = claimedItems.reduce((sum, item) => sum + Number(item.amount), 0);
  const scPerPerson = calcScPerPerson(bill.service_charge_amount ?? 0, memberCount ?? 0);
  const shareAmount = Math.round((foodAmount + scPerPerson) * 100) / 100;

  const updatePayload: Record<string, unknown> = proof_url
    ? { is_paid: true, proof_url, share_amount: shareAmount }
    : { claimed_paid: true, share_amount: shareAmount };

  const { error: updateError } = await supabaseAdmin
    .from("members")
    .update(updatePayload)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, proof_url });
}
