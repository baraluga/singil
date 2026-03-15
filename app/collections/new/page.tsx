import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { BillWithMembers } from "@/lib/types";
import NewCollectionForm from "@/components/collections/NewCollectionForm";

export default async function NewCollectionPage() {
  const { data: bills } = await supabaseAdmin
    .from("bills")
    .select("*")
    .eq("is_settled", false)
    .order("date", { ascending: false });

  const billIds = (bills ?? []).map((b) => b.id);
  const { data: members } = billIds.length
    ? await supabaseAdmin.from("members").select("*").in("bill_id", billIds)
    : { data: [] };

  const billsWithMembers: BillWithMembers[] = (bills ?? []).map((bill) => ({
    ...bill,
    members: (members ?? []).filter((m) => m.bill_id === bill.id),
  }));

  return (
    <main className="page">
      <div className="page-inner">
        <Link href="/bills" className="nav-back">← Bills</Link>
        <h1 className="page-title">New Collection</h1>
        <NewCollectionForm bills={billsWithMembers} />
      </div>
    </main>
  );
}
