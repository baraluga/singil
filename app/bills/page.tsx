import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { BillWithMembers, CollectionWithBills } from "@/lib/types";
import LogoutButton from "@/components/LogoutButton";
import BillsTabs from "@/components/bills/BillsTabs";

export default async function BillsPage() {
  const supabase = supabaseAdmin;

  const [{ data: bills }, { data: collections }] = await Promise.all([
    supabase.from("bills").select("*").order("date", { ascending: false }),
    supabase.from("collections").select("*").order("created_at", { ascending: false }),
  ]);

  const billIds = (bills ?? []).map((b) => b.id);
  const collectionIds = (collections ?? []).map((c) => c.id);

  const [membersResult, junctionResult] = await Promise.all([
    billIds.length
      ? supabase.from("members").select("*").in("bill_id", billIds)
      : Promise.resolve({ data: [] }),
    collectionIds.length
      ? supabase.from("collection_bills").select("*").in("collection_id", collectionIds)
      : Promise.resolve({ data: [] }),
  ]);

  const allMembers = membersResult.data ?? [];
  const junctionRows = junctionResult.data ?? [];

  const billsWithMembers: BillWithMembers[] = (bills ?? []).map((bill) => ({
    ...bill,
    members: allMembers.filter((m) => m.bill_id === bill.id),
  }));

  const activeBills = billsWithMembers.filter((b) => !b.is_settled);
  const settledBills = billsWithMembers.filter((b) => b.is_settled);

  const collectionsWithBills: CollectionWithBills[] = (collections ?? []).map((c) => {
    const collectionBillIds = junctionRows
      .filter((r) => r.collection_id === c.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((r) => r.bill_id);
    return {
      ...c,
      bills: collectionBillIds
        .map((id) => billsWithMembers.find((b) => b.id === id))
        .filter(Boolean) as BillWithMembers[],
    };
  });

  return (
    <main className="page">
      <div className="page-inner">
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Singil</h1>
            <p className="dash-sub">
              {activeBills.length} active · {settledBills.length} settled · {collectionsWithBills.length} collections
            </p>
          </div>
          <div className="dash-actions">
            <Link href="/settings" className="btn-settings">⚙️</Link>
            <Link href="/bills/new" className="btn-new">＋ New bill</Link>
          </div>
        </div>

        <BillsTabs
          activeBills={activeBills}
          settledBills={settledBills}
          collections={collectionsWithBills}
        />

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
