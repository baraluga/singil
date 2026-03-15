"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function confirmPaid(memberId: string, billId: string) {
  await supabaseAdmin
    .from("members")
    .update({ is_paid: true, claimed_paid: false })
    .eq("id", memberId);
  revalidatePath(`/bills/${billId}`);
}

export async function dismissClaim(memberId: string, billId: string) {
  await supabaseAdmin
    .from("members")
    .update({ claimed_paid: false })
    .eq("id", memberId);
  revalidatePath(`/bills/${billId}`);
}

export async function markPaid(memberId: string, billId: string) {
  await supabaseAdmin
    .from("members")
    .update({ is_paid: true })
    .eq("id", memberId);
  revalidatePath(`/bills/${billId}`);
}

export async function updateMemberName(memberId: string, name: string, billId: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  await supabaseAdmin.from("members").update({ name: trimmed }).eq("id", memberId);
  revalidatePath(`/bills/${billId}`);
}

export async function settleBill(billId: string) {
  await supabaseAdmin
    .from("bills")
    .update({ is_settled: true })
    .eq("id", billId);
  revalidatePath("/bills");
  redirect("/bills");
}
