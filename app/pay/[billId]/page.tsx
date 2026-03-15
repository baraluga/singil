import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import PayeeView from "@/components/pay/PayeeView";

const CREATOR_ID = "00000000-0000-0000-0000-000000000001";

export default async function PayPage({ params }: { params: Promise<{ billId: string }> }) {
  const { billId } = await params;

  const [{ data: bill }, { data: members }, { data: paymentMethods }] = await Promise.all([
    supabaseAdmin.from("bills").select("*").eq("id", billId).single(),
    supabaseAdmin.from("members").select("*").eq("bill_id", billId).order("created_at", { ascending: true }),
    supabaseAdmin.from("payment_methods").select("*").eq("user_id", CREATOR_ID).eq("is_active", true).order("sort_order", { ascending: true }),
  ]);

  if (!bill) notFound();

  return (
    <PayeeView
      bill={bill}
      members={members ?? []}
      paymentMethods={paymentMethods ?? []}
    />
  );
}
