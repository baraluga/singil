import { settleBill } from "@/lib/actions/members";

export default function SettleButton({ billId }: { billId: string }) {
  return (
    <form action={settleBill.bind(null, billId)} className="mt-4">
      <button
        type="submit"
        className="w-full bg-green text-white rounded-[14px] py-4 text-[15px] font-semibold"
      >
        ✓ Settle this bill
      </button>
    </form>
  );
}
