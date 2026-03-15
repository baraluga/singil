import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: member, error: fetchError } = await supabaseAdmin
    .from("members")
    .select("id, is_paid, bill_id")
    .eq("id", id)
    .single();

  if (fetchError || !member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (member.is_paid) {
    return NextResponse.json({ ok: true, alreadyPaid: true });
  }

  const { data: bill } = await supabaseAdmin
    .from("bills")
    .select("split_mode, service_charge_pct, total_amount")
    .eq("id", member.bill_id)
    .single();

  const isHonesty = bill?.split_mode === "honesty";

  let proof_url: string | null = null;
  let honestyFoodAmount: number | null = null;

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const amountRaw = formData.get("amount");
    if (isHonesty && amountRaw) honestyFoodAmount = parseFloat(String(amountRaw)) || null;

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
    if (isHonesty && body.amount != null) honestyFoodAmount = parseFloat(body.amount) || null;
  }

  if (isHonesty) {
    if (!honestyFoodAmount || honestyFoodAmount <= 0) {
      return NextResponse.json({ error: "Amount is required for honesty mode" }, { status: 400 });
    }
    if (bill && honestyFoodAmount > bill.total_amount) {
      return NextResponse.json({ error: "Amount exceeds bill total" }, { status: 400 });
    }
  }

  const scPct = bill?.service_charge_pct ?? 0;
  const computedShareAmount = isHonesty && honestyFoodAmount
    ? Math.round(honestyFoodAmount * (1 + scPct / 100) * 100) / 100
    : null;

  const updatePayload: Record<string, unknown> = { claimed_paid: true };
  if (proof_url) updatePayload.proof_url = proof_url;
  if (computedShareAmount != null) updatePayload.share_amount = computedShareAmount;

  const { error: updateError } = await supabaseAdmin
    .from("members")
    .update(updatePayload)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, proof_url });
}
