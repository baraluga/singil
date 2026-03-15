"use server";

import { createClient } from "@/lib/supabase-server";
import { MemberInput } from "@/lib/types";

interface CreateBillInput {
  name: string;
  date: string;
  serviceChargePct: number;
  totalAmount: number;
  receiptUrl: string | null;
  members: Pick<MemberInput, "name" | "amount">[];
}

export async function createBill(data: CreateBillInput): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: bill, error: billError } = await supabase
    .from("bills")
    .insert({
      user_id: user.id,
      name: data.name,
      date: data.date,
      total_amount: data.totalAmount,
      service_charge_pct: data.serviceChargePct,
      receipt_url: data.receiptUrl,
    })
    .select("id")
    .single();

  if (billError || !bill) return { error: billError?.message ?? "Failed to create bill" };

  const { error: membersError } = await supabase.from("members").insert(
    data.members.map((m) => ({
      bill_id: bill.id,
      name: m.name,
      share_amount: m.amount,
    }))
  );

  if (membersError) return { error: membersError.message };

  return { id: bill.id };
}
