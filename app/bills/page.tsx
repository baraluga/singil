import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { BillWithMembers } from "@/lib/types";
import BillCard from "@/components/bills/BillCard";
import LogoutButton from "@/components/LogoutButton";

export default async function BillsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: bills } = await supabase
    .from("bills")
    .select("*")
    .eq("user_id", user.id)
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
    <main className="min-h-screen bg-bg px-5 pb-10">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start pt-5 pb-7">
          <div>
            <h1 className="font-serif text-[28px] text-ink leading-tight">Singil</h1>
            <p className="text-[13px] text-ink-muted mt-0.5">
              {activeBills.length} active · {settledBills.length} settled
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Link
              href="/settings"
              className="bg-surface text-ink border border-border rounded-xl px-3 py-2.5 text-[13px] font-semibold"
            >
              ⚙️
            </Link>
            <Link
              href="/bills/new"
              className="bg-accent text-white rounded-xl px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap"
            >
              ＋ New bill
            </Link>
          </div>
        </div>

        {/* Empty state */}
        {billsWithMembers.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🧾</div>
            <p className="text-ink font-medium mb-1">No bills yet</p>
            <p className="text-ink-muted text-sm">Create your first bill to get started</p>
          </div>
        )}

        {/* Active bills */}
        {activeBills.length > 0 && (
          <>
            <div className="text-[11px] font-semibold tracking-[0.1em] uppercase text-ink-muted mb-2.5">
              Active
            </div>
            {activeBills.map((bill) => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </>
        )}

        {/* Settled bills */}
        {settledBills.length > 0 && (
          <div className="mt-5">
            <div className="text-[11px] font-semibold tracking-[0.1em] uppercase text-ink-muted mb-2.5">
              Settled
            </div>
            {settledBills.map((bill) => (
              <BillCard key={bill.id} bill={bill} settled />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
