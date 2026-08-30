import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const voteSchema = z.object({
  projectId: z.uuid(),
  deviceId: z.string().length(64).regex(/^[a-f0-9]+$/),
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  // Layer 1: Cookie check — fastest rejection path
  const jar = await cookies();
  if (jar.get("rplexpo_voted")) {
    return NextResponse.json({ message: "Kamu sudah voting dari perangkat ini." }, { status: 409 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Data voting tidak valid." }, { status: 400 });
  }

  const parsed = voteSchema.safeParse(payload);
  if (!parsed.success || parsed.data.website) {
    return NextResponse.json({ message: "Request tidak valid." }, { status: 400 });
  }

  const secret = process.env.VOTER_HASH_SECRET;
  if (!secret || secret.length < 32) {
    console.error("VOTER_HASH_SECRET must contain at least 32 characters.");
    return NextResponse.json({ message: "Sistem voting belum siap. Hubungi panitia." }, { status: 503 });
  }

  // Layer 3: Device fingerprint → HMAC → voter_hash (UNIQUE in DB)
  const voterHash = createHmac("sha256", secret).update(parsed.data.deviceId).digest("hex");
  const admin = createAdminSupabase();
  const { data: result, error } = await admin.rpc("cast_vote", {
    p_project_id: parsed.data.projectId,
    p_voter_hash: voterHash,
  });

  if (result === "duplicate") {
    return NextResponse.json({ message: "Perangkat ini sudah digunakan untuk voting." }, { status: 409 });
  }
  if (result === "closed") return NextResponse.json({ message: "Voting sedang ditutup." }, { status: 403 });
  if (result === "invalid_project") return NextResponse.json({ message: "Proyek tidak ditemukan." }, { status: 404 });
  if (result === "invalid_voter") return NextResponse.json({ message: "Data perangkat tidak valid." }, { status: 400 });
  if (error || result !== "success") {
    console.error("Vote insert failed", error?.code);
    return NextResponse.json({ message: "Suara belum tersimpan. Coba sekali lagi." }, { status: 500 });
  }

  // Layer 2: Set cookie so subsequent requests are fast-rejected
  const response = NextResponse.json({ message: "Suara kamu berhasil disimpan!" }, { status: 201 });
  response.cookies.set("rplexpo_voted", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 2,
    path: "/",
  });
  return response;
}
