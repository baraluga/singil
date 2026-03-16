export interface Bill {
  id: string;
  user_id: string;
  name: string;
  date: string;
  total_amount: number;
  service_charge_amount: number;
  split_mode: SplitMode;
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
  proof_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillItem {
  id: string;
  bill_id: string;
  name: string;
  amount: number;
  claimed_by: string | null;
  created_at: string;
}

export interface BillWithMembers extends Bill {
  members: Member[];
  items?: BillItem[];
}

export interface MemberInput {
  tempId: string;
  name: string;
  amount: number;
}

export interface BillItemInput {
  tempId: string;
  name: string;
  amount: number;
}

export type SplitMode = "equal" | "honesty" | "itemized";

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CollectionWithBills extends Collection {
  bills: BillWithMembers[];
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  name: string;
  qr_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
