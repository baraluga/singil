"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { MemberInput, SplitMode } from "@/lib/types";

export async function updateBillName(billId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  await supabaseAdmin.from("bills").update({ name: trimmed }).eq("id", billId);
  revalidatePath(`/bills/${billId}`);
  revalidatePath("/bills");
}

export async function uploadReceipt(formData: FormData): Promise<{ url: string } | { error: string }> {
  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided" };

  const ext = file.name.split(".").pop();
  const path = `${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { data, error } = await supabaseAdmin.storage
    .from("receipts")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (error) return { error: error.message };

  const { data: urlData } = supabaseAdmin.storage.from("receipts").getPublicUrl(data.path);
  return { url: urlData.publicUrl };
}

// Fixed creator ID — single-user app, no auth.users dependency needed
const CREATOR_ID = "00000000-0000-0000-0000-000000000001";

interface CreateBillInput {
  name: string;
  date: string;
  serviceChargePct: number;
  totalAmount: number;
  receiptUrl: string | null;
  splitMode: SplitMode;
  members: Pick<MemberInput, "name" | "amount">[];
}

export async function createBill(data: CreateBillInput): Promise<{ id: string } | { error: string }> {
  const { data: bill, error: billError } = await supabaseAdmin
    .from("bills")
    .insert({
      user_id: CREATOR_ID,
      name: data.name,
      date: data.date,
      total_amount: data.totalAmount,
      service_charge_pct: data.serviceChargePct,
      split_mode: data.splitMode,
      receipt_url: data.receiptUrl,
    })
    .select("id")
    .single();

  if (billError || !bill) return { error: billError?.message ?? "Failed to create bill" };

  const { error: membersError } = await supabaseAdmin.from("members").insert(
    data.members.map((m) => ({
      bill_id: bill.id,
      name: m.name,
      share_amount: m.amount,
    }))
  );

  if (membersError) return { error: membersError.message };

  return { id: bill.id };
}
