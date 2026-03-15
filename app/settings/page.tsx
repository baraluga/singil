import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import PaymentMethodsManager from "@/components/settings/PaymentMethodsManager";

const CREATOR_ID = "00000000-0000-0000-0000-000000000001";

export default async function SettingsPage() {
  const { data: methods } = await supabaseAdmin
    .from("payment_methods")
    .select("*")
    .eq("user_id", CREATOR_ID)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <main className="page">
      <div className="page-inner">
        <Link href="/bills" className="nav-back">← Bills</Link>
        <h1 className="page-title">Payment Methods</h1>
        <PaymentMethodsManager initialMethods={methods ?? []} />
      </div>
    </main>
  );
}
