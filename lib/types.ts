export interface Bill {
  id: string;
  user_id: string;
  name: string;
  date: string;
  total_amount: number;
  service_charge_pct: number;
  receipt_url: string | null;
  is_settled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  bill_id: string;
  name: string;
  share_amount: number;
  is_paid: boolean;
  claimed_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillWithMembers extends Bill {
  members: Member[];
}

export interface MemberInput {
  tempId: string;
  name: string;
  amount: number;
}

export type SplitMode = "equal" | "manual";
