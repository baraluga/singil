"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";

const CREATOR_ID = "00000000-0000-0000-0000-000000000001";

export async function uploadQr(formData: FormData): Promise<{ url: string } | { error: string }> {
  const file = formData.get("file") as File | null;
  if (!file) return { error: "No file provided" };

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { data, error } = await supabaseAdmin.storage
    .from("qr-codes")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (error) return { error: error.message };

  const { data: urlData } = supabaseAdmin.storage.from("qr-codes").getPublicUrl(data.path);
  return { url: urlData.publicUrl };
}

export async function createPaymentMethod(data: { name: string; qrUrl: string | null }) {
  const { data: existing } = await supabaseAdmin
    .from("payment_methods")
    .select("sort_order")
    .eq("user_id", CREATOR_ID)
    .eq("is_active", true)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = existing ? existing.sort_order + 1 : 0;

  const { data: method, error } = await supabaseAdmin
    .from("payment_methods")
    .insert({ user_id: CREATOR_ID, name: data.name, qr_url: data.qrUrl, sort_order: nextOrder })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  return method;
}

export async function updatePaymentMethod(id: string, data: { name?: string; qrUrl?: string | null }) {
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.qrUrl !== undefined) update.qr_url = data.qrUrl;

  const { data: method, error } = await supabaseAdmin
    .from("payment_methods")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  return method;
}

export async function deletePaymentMethod(id: string) {
  await supabaseAdmin
    .from("payment_methods")
    .update({ is_active: false })
    .eq("id", id);

  revalidatePath("/settings");
}

export async function reorderPaymentMethod(id: string, direction: "up" | "down", allIds: string[]) {
  const idx = allIds.indexOf(id);
  if (idx === -1) return;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= allIds.length) return;

  // Fetch both items' current sort_orders
  const { data: items } = await supabaseAdmin
    .from("payment_methods")
    .select("id, sort_order")
    .in("id", [id, allIds[swapIdx]]);

  if (!items || items.length !== 2) return;

  const a = items.find((i) => i.id === id)!;
  const b = items.find((i) => i.id === allIds[swapIdx])!;

  await Promise.all([
    supabaseAdmin.from("payment_methods").update({ sort_order: b.sort_order }).eq("id", a.id),
    supabaseAdmin.from("payment_methods").update({ sort_order: a.sort_order }).eq("id", b.id),
  ]);

  revalidatePath("/settings");
}
