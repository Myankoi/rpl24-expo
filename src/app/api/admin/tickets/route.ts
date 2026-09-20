import { createHmac, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getActiveEvent, getCurrentProfile } from "@/lib/dal";
import { createAdminSupabase } from "@/lib/supabase/admin";

const batchSchema = z.object({
  label: z.string().trim().min(2).max(100),
  quantity: z.number().int().min(1).max(500),
});

function hashToken(token: string) {
  const secret = process.env.VOTING_TICKET_SECRET ?? process.env.VOTER_HASH_SECRET;
  if (!secret || secret.length < 32) throw new Error("VOTING_TICKET_SECRET is not configured.");
  return createHmac("sha256", secret).update(token).digest("hex");
}

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) return NextResponse.json({ message: "Akses khusus panitia." }, { status: 403 });
  const event = await getActiveEvent();
  if (["published", "archived"].includes(event.status)) return NextResponse.json({ message: "Edisi sudah ditutup." }, { status: 409 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Data batch tidak valid." }, { status: 400 });
  }
  const parsed = batchSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ message: "Isi label dan jumlah tiket dengan benar." }, { status: 400 });

  const admin = createAdminSupabase();
  const { data: batch, error: batchError } = await admin.from("voting_ticket_batches").insert({
    event_id: event.id,
    label: parsed.data.label,
    quantity: parsed.data.quantity,
    created_by: profile.id,
  }).select("id").single();
  if (batchError || !batch) return NextResponse.json({ message: "Batch tiket gagal dibuat." }, { status: 500 });

  const tokens = Array.from({ length: parsed.data.quantity }, () => randomBytes(18).toString("base64url"));
  const { error: ticketError } = await admin.from("voting_tickets").insert(tokens.map((token) => ({
    event_id: event.id,
    batch_id: batch.id,
    token_hash: hashToken(token),
  })));
  if (ticketError) {
    await admin.from("voting_ticket_batches").delete().eq("id", batch.id);
    return NextResponse.json({ message: "Tiket gagal disimpan." }, { status: 500 });
  }

  return NextResponse.json({
    eventName: event.displayName,
    eventSlug: event.slug,
    tickets: tokens.map((token) => ({ token, code: token })),
  }, { status: 201 });
}
