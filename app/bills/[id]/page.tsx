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
  const collected = memberList.reduce((sum, m) => sum + (m.share_amount > 0 ? m.share_amount : 0), 0);
  const myShare = bill.total_amount - collected;

  const date = new Date(bill.date).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 40 }}>
      <div className="page-inner" style={{ padding: "0 20px" }}>
        <Link href="/bills" className="nav-back">← Bills</Link>
      </div>

      <div className="bill-hero">
        <div className="bill-hero-inner" style={{ padding: "0 20px" }}>
          <div className="bill-hero-circle" />
          {bill.receipt_url && <ReceiptThumbnail url={bill.receipt_url} />}
          <h1 className="bill-hero-name">{bill.name}</h1>
          <p className="bill-hero-meta">
            {date} · {memberList.length} {memberList.length === 1 ? "member" : "members"} · SC {bill.service_charge_pct}%
          </p>
          <p className="bill-hero-total">
            {formatCurrency(bill.total_amount)}{" "}
            <span>total</span>
          </p>
          {myShare > 0 && (
            <p className="bill-hero-my-share">
              {formatCurrency(myShare)}{" "}
              <span>your share</span>
            </p>
          )}
        </div>
      </div>

      <div className="page-inner" style={{ padding: "0 20px" }}>
        <ShareButtons billId={bill.id} billName={bill.name} />

        <div className="section-label">Members</div>

        {memberList.map((member, i) => (
          <MemberDetailRow
            key={member.id}
            member={member}
            scPct={bill.service_charge_pct}
            index={i}
            billId={bill.id}
          />
        ))}

        {allPaid && !bill.is_settled && <SettleButton billId={bill.id} />}
        {bill.is_settled && (
          <div className="settled-notice">✓ This bill is settled</div>
        )}
      </div>
    </main>
  );
}
