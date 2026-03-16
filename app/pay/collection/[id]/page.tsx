import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { BillWithMembers } from "@/lib/types";
import CollectionPayeeView from "@/components/pay/CollectionPayeeView";

const CREATOR_ID = "00000000-0000-0000-0000-000000000001";

export const dynamic = "force-dynamic";

export default async function CollectionPayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: collection } = await supabaseAdmin
    .from("collections")
    .select("*")
    .eq("id", id)
    .single();

  if (!collection) notFound();

  const { data: junctionRows } = await supabaseAdmin
    .from("collection_bills")
    .select("bill_id")
    .eq("collection_id", id)
    .order("sort_order", { ascending: true });

  const billIds = (junctionRows ?? []).map((r) => r.bill_id);

  const [billsResult, paymentMethodsResult] = await Promise.all([
    billIds.length
      ? supabaseAdmin.from("bills").select("*").in("id", billIds)
      : Promise.resolve({ data: [] }),
    supabaseAdmin
      .from("payment_methods")
      .select("*")
      .eq("user_id", CREATOR_ID)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  const bills = billsResult.data ?? [];
  const allBillIds = bills.map((b) => b.id);

  const { data: allMembers } = allBillIds.length
    ? await supabaseAdmin.from("members").select("*").in("bill_id", allBillIds)
    : { data: [] };

  const itemizedBillIds = bills.filter((b) => b.split_mode === "itemized").map((b) => b.id);
  const { data: allBillItems } = itemizedBillIds.length
    ? await supabaseAdmin.from("bill_items").select("*").in("bill_id", itemizedBillIds).order("created_at")
    : { data: [] };

  // Sort bills by junction sort_order
  const billsWithMembers: BillWithMembers[] = billIds
    .map((billId) => {
      const bill = bills.find((b) => b.id === billId);
      if (!bill) return null;
      return {
        ...bill,
        members: (allMembers ?? []).filter((m) => m.bill_id === bill.id),
        items: (allBillItems ?? []).filter((i) => i.bill_id === bill.id),
      };
    })
    .filter(Boolean) as BillWithMembers[];

  return (
    <CollectionPayeeView
      collection={collection}
      bills={billsWithMembers}
      paymentMethods={paymentMethodsResult.data ?? []}
    />
  );
}
