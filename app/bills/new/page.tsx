import Link from "next/link";
import CreateBillForm from "@/components/forms/CreateBillForm";

export default function NewBillPage() {
  return (
    <main className="page">
      <div className="page-inner">
        <Link href="/bills" className="nav-back">← Bills</Link>
        <h1 className="page-title">New Bill</h1>
        <CreateBillForm />
      </div>
    </main>
  );
}
