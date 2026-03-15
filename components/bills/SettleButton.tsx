import { settleBill } from "@/lib/actions/members";

export default function SettleButton({ billId }: { billId: string }) {
  return (
    <form action={settleBill.bind(null, billId)} style={{ marginTop: 16 }}>
      <button type="submit" className="btn-green">
        ✓ Settle this bill
      </button>
    </form>
  );
}
