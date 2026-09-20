import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getEventBySlug } from "@/lib/dal";

export const runtime = "nodejs";

const voteSchema = z.object({
  eventSlug: z.string().trim().min(2).max(120),
  projectId: z.uuid(),
  ticketToken: z.string().trim().min(12).max(160).regex(/^[A-Za-z0-9_-]+$/).optional(),
});

function ticketSecret() {
  const secret = process.env.VOTING_TICKET_SECRET ?? process.env.VOTER_HASH_SECRET;
  if (!secret || secret.length < 32) throw new Error("VOTING_TICKET_SECRET must contain at least 32 characters.");
  return secret;
}

function tokenHash(token: string) {
  return createHmac("sha256", ticketSecret()).update(token).digest("hex");
}

function signedTicketId(ticketId: string) {
  return `${ticketId}.${createHmac("sha256", ticketSecret()).update(ticketId).digest("hex")}`;
}

function verifyTicketCookie(value: string | undefined) {
  if (!value) return null;
  const [ticketId, signature] = value.split(".");
  if (!ticketId || !signature) return null;
  const expected = createHmac("sha256", ticketSecret()).update(ticketId).digest("hex");
  return signature === expected ? ticketId : null;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Data voting tidak valid." }, { status: 400 });
  }

  const parsed = voteSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ message: "Event, proyek, dan tiket wajib diisi." }, { status: 400 });

  const event = await getEventBySlug(parsed.data.eventSlug);
  if (!event) return NextResponse.json({ message: "Edisi tidak ditemukan." }, { status: 404 });

  const jar = await cookies();
  const cookieName = `rplexpo_ticket_${event.id}`;
  let ticketId = verifyTicketCookie(jar.get(cookieName)?.value);
  const admin = createAdminSupabase();

  if (parsed.data.ticketToken) {
    const { data: ticket, error: ticketError } = await admin
      .from("voting_tickets")
      .select("id, event_id, redeemed_at")
      .eq("event_id", event.id)
      .eq("token_hash", tokenHash(parsed.data.ticketToken))
      .maybeSingle();
    if (ticketError) {
      console.error("Ticket lookup failed", ticketError.code);
      return NextResponse.json({ message: "Tiket belum dapat diverifikasi." }, { status: 503 });
    }
    if (!ticket) return NextResponse.json({ message: "Kode tiket tidak ditemukan." }, { status: 404 });
    if (ticket.redeemed_at) return NextResponse.json({ message: "Tiket ini sudah digunakan." }, { status: 409 });
    ticketId = ticket.id;
  }

  if (!ticketId) return NextResponse.json({ message: "Masukkan kode tiket pengunjung." }, { status: 401 });

  const { data: result, error } = await admin.rpc("cast_event_vote", {
    p_event_id: event.id,
    p_project_id: parsed.data.projectId,
    p_ticket_id: ticketId,
  });

  if (result === "duplicate") return NextResponse.json({ message: "Tiket ini sudah digunakan untuk voting." }, { status: 409 });
  if (result === "closed") return NextResponse.json({ message: "Voting sedang ditutup." }, { status: 403 });
  if (result === "invalid_project") return NextResponse.json({ message: "Proyek tidak ditemukan." }, { status: 404 });
  if (result === "invalid_ticket") return NextResponse.json({ message: "Tiket tidak valid untuk edisi ini." }, { status: 400 });
  if (error || result !== "success") {
    console.error("Vote insert failed", error?.code);
    return NextResponse.json({ message: "Suara belum tersimpan. Coba sekali lagi." }, { status: 500 });
  }

  const response = NextResponse.json({ message: "Suara kamu berhasil disimpan!" }, { status: 201 });
  response.cookies.set(cookieName, signedTicketId(ticketId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/",
  });
  return response;
}
