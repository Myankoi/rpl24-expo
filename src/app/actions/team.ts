"use server";

import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getActiveEvent, requireUser } from "@/lib/dal";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { isValidHttpUrl, slugify } from "@/lib/utils";

function go(message: string, type: "success" | "error" = "success"): never {
  redirect(`/dashboard?${type}=${encodeURIComponent(message)}`);
}

const teamSchema = z.object({
  name: z.string().trim().min(2).max(80),
  className: z.string().trim().min(2).max(40),
  enrollmentCode: z.string().trim().max(100).default(""),
});

async function requireRegistrationEvent() {
  const event = await getActiveEvent();
  if (!["registration", "review"].includes(event.status)) {
    go("Pendaftaran dan perubahan tim sedang ditutup.", "error");
  }
  return event;
}

function enrollmentHash(code: string) {
  const secret = process.env.ENROLLMENT_CODE_SECRET ?? process.env.VOTER_HASH_SECRET;
  if (!secret || secret.length < 32) return null;
  return createHmac("sha256", secret).update(code.trim().toUpperCase()).digest("hex");
}

async function ensureEnrollment(eventId: string, userId: string, className: string, enrollmentCode: string) {
  const admin = createAdminSupabase();
  const { data: existing } = await admin.from("event_enrollments").select("user_id").eq("event_id", eventId).eq("user_id", userId).maybeSingle();
  if (existing) return;
  const { data: eventSecret } = await admin.from("events").select("enrollment_code_hash").eq("id", eventId).single();
  const expectedHash = eventSecret?.enrollment_code_hash ?? enrollmentHash(process.env.EVENT_ENROLLMENT_CODE ?? "");
  if (!expectedHash || enrollmentHash(enrollmentCode) !== expectedHash) go("Kode enrollment edisi ini belum benar.", "error");
  const { error } = await admin.from("event_enrollments").upsert(
    { event_id: eventId, user_id: userId, class_name: className },
    { onConflict: "event_id,user_id", ignoreDuplicates: true },
  );
  if (error) go("Akun belum terdaftar pada edisi aktif.", "error");
}

export async function createTeamAction(formData: FormData) {
  const user = await requireUser();
  const event = await requireRegistrationEvent();
  const parsed = teamSchema.safeParse({ name: formData.get("name"), className: formData.get("className"), enrollmentCode: String(formData.get("enrollmentCode") ?? "") });
  if (!parsed.success) go("Nama tim atau kelas belum valid.", "error");

  const admin = createAdminSupabase();
  await ensureEnrollment(event.id, user.id, parsed.data.className, parsed.data.enrollmentCode);
  const { data: existing } = await admin.from("team_members").select("team_id").eq("event_id", event.id).eq("user_id", user.id).maybeSingle();
  if (existing) go("Kamu sudah tergabung dalam tim pada edisi ini.", "error");

  const joinCode = randomBytes(5).toString("base64url").slice(0, 8).toUpperCase();
  const { data: team, error } = await admin.from("teams").insert({
    event_id: event.id,
    name: parsed.data.name,
    class_name: parsed.data.className,
    join_code: joinCode,
    leader_id: user.id,
  }).select("id").single();
  if (error || !team) go("Tim belum berhasil dibuat. Coba kembali.", "error");

  const { error: memberError } = await admin.from("team_members").insert({ event_id: event.id, team_id: team.id, user_id: user.id });
  if (memberError) {
    await admin.from("teams").delete().eq("id", team.id).eq("event_id", event.id);
    go("Tim belum berhasil dibuat. Coba kembali.", "error");
  }
  revalidatePath("/dashboard");
  go("Tim berhasil dibuat. Bagikan kode undangan ke anggota.");
}

export async function joinTeamAction(formData: FormData) {
  const user = await requireUser();
  const event = await requireRegistrationEvent();
  const code = String(formData.get("joinCode") ?? "").trim().toUpperCase();
  const enrollmentCode = String(formData.get("enrollmentCode") ?? "").trim();
  if (!/^[A-Z0-9]{8}$/.test(code)) go("Kode tim harus berisi 8 karakter.", "error");

  const admin = createAdminSupabase();
  await ensureEnrollment(event.id, user.id, user.className, enrollmentCode);
  const [{ data: existing }, { data: team }] = await Promise.all([
    admin.from("team_members").select("team_id").eq("event_id", event.id).eq("user_id", user.id).maybeSingle(),
    admin.from("teams").select("id").eq("event_id", event.id).eq("join_code", code).maybeSingle(),
  ]);
  if (existing) go("Kamu sudah tergabung dalam tim pada edisi ini.", "error");
  if (!team) go("Kode tim tidak ditemukan.", "error");

  const { count } = await admin.from("team_members").select("user_id", { count: "exact", head: true }).eq("event_id", event.id).eq("team_id", team.id);
  if ((count ?? 0) >= event.teamMaxSize) go("Tim ini sudah mencapai jumlah anggota maksimal.", "error");
  const { error } = await admin.from("team_members").insert({ event_id: event.id, team_id: team.id, user_id: user.id });
  if (error) go("Belum berhasil bergabung. Coba kembali.", "error");
  revalidatePath("/dashboard");
  go("Kamu berhasil bergabung dengan tim.");
}

const projectSchema = z.object({
  title: z.string().trim().min(2).max(100),
  tagline: z.string().trim().min(2).max(160),
  description: z.string().trim().min(20).max(3000),
  category: z.string().trim().min(2).max(60),
  demoUrl: z.string().trim().max(500),
  repoUrl: z.string().trim().max(500),
});

export async function saveProjectAction(formData: FormData) {
  const user = await requireUser();
  const event = await requireRegistrationEvent();
  const parsed = projectSchema.safeParse({
    title: formData.get("title"),
    tagline: formData.get("tagline"),
    description: formData.get("description"),
    category: formData.get("category"),
    demoUrl: formData.get("demoUrl"),
    repoUrl: formData.get("repoUrl"),
  });
  if (!parsed.success) go(parsed.error.issues[0]?.message ?? "Data proyek belum lengkap.", "error");
  if (!isValidHttpUrl(parsed.data.demoUrl) || !isValidHttpUrl(parsed.data.repoUrl)) go("Link demo atau repository tidak valid.", "error");

  const admin = createAdminSupabase();
  const { data: membership } = await admin.from("team_members").select("team_id").eq("event_id", event.id).eq("user_id", user.id).maybeSingle();
  if (!membership) go("Buat atau gabung tim terlebih dahulu.", "error");
  const { data: team } = await admin.from("teams").select("id, leader_id").eq("event_id", event.id).eq("id", membership.team_id).single();
  if (!team || team.leader_id !== user.id) go("Hanya ketua tim yang dapat mengubah proyek.", "error");

  const { data: existing } = await admin.from("projects").select("id, slug, cover_url, status").eq("event_id", event.id).eq("team_id", team.id).maybeSingle();
  if (existing?.status === "approved") go("Proyek yang sudah disetujui menunggu penguncian organizer.", "error");

  let coverUrl = existing?.cover_url ?? null;
  let uploadedPath: string | null = null;
  const cover = formData.get("cover");
  if (cover instanceof File && cover.size > 0) {
    if (cover.size > 3 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(cover.type)) {
      go("Cover harus JPG, PNG, atau WebP dengan ukuran maksimal 3 MB.", "error");
    }
    const extension = cover.type === "image/png" ? "png" : cover.type === "image/webp" ? "webp" : "jpg";
    uploadedPath = `${event.id}/${team.id}/${randomUUID()}.${extension}`;
    const { error: uploadError } = await admin.storage.from("project-covers").upload(uploadedPath, await cover.arrayBuffer(), { contentType: cover.type, upsert: false });
    if (uploadError) go("Cover gagal diunggah. Coba kembali.", "error");
    coverUrl = admin.storage.from("project-covers").getPublicUrl(uploadedPath).data.publicUrl;
  }

  const slug = existing?.slug ?? `${slugify(parsed.data.title)}-${team.id.slice(0, 6)}`;
  const projectData = {
    event_id: event.id,
    team_id: team.id,
    title: parsed.data.title,
    slug,
    tagline: parsed.data.tagline,
    description: parsed.data.description,
    category: parsed.data.category,
    demo_url: parsed.data.demoUrl || null,
    repo_url: parsed.data.repoUrl || null,
    cover_url: coverUrl,
    status: "submitted" as const,
  };
  const query = existing
    ? admin.from("projects").update(projectData).eq("id", existing.id).eq("event_id", event.id)
    : admin.from("projects").insert(projectData);
  const { error } = await query;
  if (error) {
    if (uploadedPath) await admin.storage.from("project-covers").remove([uploadedPath]);
    if (error.code === "23505") go("Slug atau proyek tim sudah digunakan pada edisi ini.", "error");
    go("Proyek belum berhasil disimpan.", "error");
  }
  revalidatePath("/dashboard");
  revalidatePath("/catalog");
  go("Proyek dikirim ke panitia untuk direview.");
}
