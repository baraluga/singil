"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";

const CREATOR_ID = "00000000-0000-0000-0000-000000000001";

export async function createCollection(data: {
  name: string;
  billIds: string[];
}): Promise<{ id: string } | { error: string }> {
  const { data: collection, error: collectionError } = await supabaseAdmin
    .from("collections")
    .insert({ user_id: CREATOR_ID, name: data.name })
    .select("id")
    .single();

  if (collectionError || !collection) {
    return { error: collectionError?.message ?? "Failed to create collection" };
  }

  const { error: junctionError } = await supabaseAdmin
    .from("collection_bills")
    .insert(
      data.billIds.map((billId, i) => ({
        collection_id: collection.id,
        bill_id: billId,
        sort_order: i,
      }))
    );

  if (junctionError) return { error: junctionError.message };

  revalidatePath("/bills");
  return { id: collection.id };
}

export async function updateCollection(
  id: string,
  data: { name: string; billIds: string[] }
): Promise<{ ok: true } | { error: string }> {
  const { error: updateError } = await supabaseAdmin
    .from("collections")
    .update({ name: data.name })
    .eq("id", id);

  if (updateError) return { error: updateError.message };

  // Replace junction rows
  await supabaseAdmin.from("collection_bills").delete().eq("collection_id", id);

  const { error: junctionError } = await supabaseAdmin
    .from("collection_bills")
    .insert(
      data.billIds.map((billId, i) => ({
        collection_id: id,
        bill_id: billId,
        sort_order: i,
      }))
    );

  if (junctionError) return { error: junctionError.message };

  revalidatePath("/bills");
  revalidatePath(`/collections/${id}`);
  return { ok: true };
}

export async function deleteCollection(id: string): Promise<void> {
  await supabaseAdmin.from("collections").delete().eq("id", id);
  revalidatePath("/bills");
  redirect("/bills");
}
