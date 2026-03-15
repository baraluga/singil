import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { formatCurrency } from "@/lib/utils/currency";
import MemberDetailRow from "@/components/bills/MemberDetailRow";
import ShareButtons from "@/components/bills/ShareButtons";
import ReceiptThumbnail from "@/components/bills/ReceiptThumbnail";
import SettleButton from "@/components/bills/SettleButton";

export default async function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: bill } = await supabaseAdmin
    .from("bills")
    .select("*")
    .eq("id", id)
    .single();

  if (!bill) notFound();

  const { data: members } = await supabaseAdmin
    .from("members")
    .select("*")
    .eq("bill_id", id)
    .order("created_at", { ascending: true });

  const memberList = members ?? [];
  const allPaid = memberList.length > 0 && memberList.every((m) => m.is_paid);

  const date = new Date(bill.date).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-bg pb-10">
      <div className="max-w-sm mx-auto px-5">
        <Link
          href="/bills"
          className="flex items-center gap-1.5 text-accent text-sm font-medium pt-5 mb-0"
        >
          ← Bills
        </Link>
      </div>

      {/* Dark hero header */}
      <div className="bg-ink relative overflow-hidden mx-0 px-5 py-5 mb-5">
        <div className="max-w-sm mx-auto relative">
          {bill.receipt_url && <ReceiptThumbnail url={bill.receipt_url} />}
          {/* Decorative circle */}
          <div className="absolute -right-8 -top-8 w-[120px] h-[120px] rounded-full bg-accent/15 pointer-events-none" />
          <h1 className="font-serif text-[22px] text-white">{bill.name}</h1>
          <p className="text-xs text-white/50 mt-1">
            {date} · {memberList.length} {memberList.length === 1 ? "member" : "members"} · SC {bill.service_charge_pct}%
          </p>
          <p className="font-serif text-[36px] text-white mt-2.5">
            {formatCurrency(bill.total_amount)}{" "}
            <span className="font-sans text-[13px] text-white/50">total</span>
          </p>
        </div>
      </div>

      <div className="max-w-sm mx-auto px-5">
        {/* Share buttons (BAR-35) */}
        <ShareButtons billId={bill.id} billName={bill.name} />

        {/* Members section */}
        <div className="text-[11px] font-semibold tracking-widest uppercase text-ink-muted mb-3">
          Members
        </div>

        {memberList.map((member, i) => (
          <MemberDetailRow
            key={member.id}
            member={member}
            scPct={bill.service_charge_pct}
            index={i}
            billId={bill.id}
          />
        ))}

        {/* Settle button when all paid */}
        {allPaid && !bill.is_settled && <SettleButton billId={bill.id} />}
        {bill.is_settled && (
          <div className="mt-4 text-center py-3 text-green font-semibold text-sm">
            ✓ This bill is settled
          </div>
        )}
      </div>
    </main>
  );
}
