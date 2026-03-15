import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await request.json().catch(() => null);
  if (!body || body.claimedPaid !== true) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: member, error: fetchError } = await supabaseAdmin
    .from("members")
    .select("id, is_paid")
    .eq("id", id)
    .single();

  if (fetchError || !member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (member.is_paid) {
    return NextResponse.json({ ok: true, alreadyPaid: true });
  }

  await supabaseAdmin
    .from("members")
    .update({ claimed_paid: true })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
