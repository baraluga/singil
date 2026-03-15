"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { MemberInput } from "@/lib/types";

// Fixed creator ID — single-user app, no auth.users dependency needed
const CREATOR_ID = "00000000-0000-0000-0000-000000000001";

interface CreateBillInput {
  name: string;
  date: string;
  serviceChargePct: number;
  totalAmount: number;
  receiptUrl: string | null;
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
