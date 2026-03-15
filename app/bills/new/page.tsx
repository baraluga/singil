import Link from "next/link";
import CreateBillForm from "@/components/forms/CreateBillForm";

export default function NewBillPage() {
  return (
    <main className="min-h-screen bg-bg px-5 pb-10">
      <div className="max-w-sm mx-auto">
        <Link
          href="/bills"
          className="flex items-center gap-1.5 text-accent text-sm font-medium pt-5 mb-4"
        >
          ← Bills
        </Link>
        <h1 className="font-serif text-2xl text-ink mb-5">New Bill</h1>
        <CreateBillForm />
      </div>
    </main>
  );
}
