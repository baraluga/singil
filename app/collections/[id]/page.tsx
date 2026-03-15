import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { BillWithMembers } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";
import BillCard from "@/components/bills/BillCard";
import CollectionShareButtons from "@/components/collections/CollectionShareButtons";
import DeleteCollectionButton from "@/components/collections/DeleteCollectionButton";

export default async function CollectionDetailPage({
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

  const [billsResult] = await Promise.all([
    billIds.length
      ? supabaseAdmin.from("bills").select("*").in("id", billIds)
      : Promise.resolve({ data: [] }),
  ]);

  const bills = billsResult.data ?? [];
  const allBillIds = bills.map((b) => b.id);

  const { data: allMembers } = allBillIds.length
    ? await supabaseAdmin.from("members").select("*").in("bill_id", allBillIds)
    : { data: [] };

  const billsWithMembers: BillWithMembers[] = billIds
    .map((billId) => {
      const bill = bills.find((b) => b.id === billId);
      if (!bill) return null;
      return {
        ...bill,
        members: (allMembers ?? []).filter((m) => m.bill_id === bill.id),
      };
    })
    .filter(Boolean) as BillWithMembers[];

  const totalAmount = billsWithMembers.reduce((s, b) => s + b.total_amount, 0);

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 40 }}>
      <div className="page-inner" style={{ padding: "0 20px" }}>
        <Link href="/bills" className="nav-back">← Bills</Link>
      </div>

      <div className="bill-hero">
        <div className="bill-hero-inner" style={{ padding: "0 20px" }}>
          <div className="bill-hero-circle" />
          <h1 className="bill-hero-name">{collection.name}</h1>
          <p className="bill-hero-meta">
            {billsWithMembers.length} {billsWithMembers.length === 1 ? "bill" : "bills"}
          </p>
          <p className="bill-hero-total">
            {formatCurrency(totalAmount)} <span>total</span>
          </p>
        </div>
      </div>

      <div className="page-inner" style={{ padding: "0 20px" }}>
        <CollectionShareButtons
          collectionId={collection.id}
          collectionName={collection.name}
        />

        <div className="section-label">Bills in this collection</div>
        <div className="bills-grid">
          {billsWithMembers.map((bill) => (
            <BillCard key={bill.id} bill={bill} settled={bill.is_settled} />
          ))}
        </div>

        <div style={{ marginTop: 32 }}>
          <DeleteCollectionButton collectionId={collection.id} />
        </div>
      </div>
    </main>
  );
}
