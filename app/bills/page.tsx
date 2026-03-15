import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { BillWithMembers } from "@/lib/types";
import BillCard from "@/components/bills/BillCard";
import LogoutButton from "@/components/LogoutButton";

export default async function BillsPage() {
  const supabase = supabaseAdmin;

  const { data: bills } = await supabase
    .from("bills")
    .select("*")
    .order("date", { ascending: false });

  const billIds = (bills ?? []).map((b) => b.id);

  const { data: members } = billIds.length
    ? await supabase.from("members").select("*").in("bill_id", billIds)
    : { data: [] };

  const billsWithMembers: BillWithMembers[] = (bills ?? []).map((bill) => ({
    ...bill,
    members: (members ?? []).filter((m) => m.bill_id === bill.id),
  }));

  const activeBills = billsWithMembers.filter((b) => !b.is_settled);
  const settledBills = billsWithMembers.filter((b) => b.is_settled);

  return (
    <main className="page">
      <div className="page-inner">
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Singil</h1>
            <p className="dash-sub">
              {activeBills.length} active · {settledBills.length} settled
            </p>
          </div>
          <div className="dash-actions">
            <Link href="/settings" className="btn-settings">⚙️</Link>
            <Link href="/bills/new" className="btn-new">＋ New bill</Link>
          </div>
        </div>

        {billsWithMembers.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            <p className="empty-state-title">No bills yet</p>
            <p className="empty-state-sub">Create your first bill to get started</p>
          </div>
        )}

        {activeBills.length > 0 && (
          <>
            <div className="section-label">Active</div>
            {activeBills.map((bill) => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </>
        )}

        {settledBills.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div className="section-label">Settled</div>
            {settledBills.map((bill) => (
              <BillCard key={bill.id} bill={bill} settled />
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
