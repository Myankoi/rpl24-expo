"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/dal";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { isValidHttpUrl, slugify } from "@/lib/utils";

function go(message: string, type: "success" | "error" = "success"): never {
  redirect(`/dashboard?${type}=${encodeURIComponent(message)}`);
}

const teamSchema = z.object({
  name: z.string().trim().min(2).max(80),
  className: z.string().trim().min(2).max(40),
});

export async function createTeamAction(formData: FormData) {
  const user = await requireUser();
  const parsed = teamSchema.safeParse({ name: formData.get("name"), className: formData.get("className") });
  if (!parsed.success) go("Nama tim atau kelas belum valid.", "error");

  const admin = createAdminSupabase();
  const { data: existing } = await admin.from("team_members").select("team_id").eq("user_id", user.id).maybeSingle();
  if (existing) go("Kamu sudah tergabung dalam sebuah tim.", "error");

  const joinCode = randomBytes(4).toString("hex").toUpperCase();
  const { data: team, error } = await admin.from("teams").insert({
    name: parsed.data.name,
    class_name: parsed.data.className,
    join_code: joinCode,
    leader_id: user.id,
  }).select("id").single();
  if (error || !team) go("Tim belum berhasil dibuat. Coba kembali.", "error");

  const { error: memberError } = await admin.from("team_members").insert({ team_id: team.id, user_id: user.id });
  if (memberError) {
    await admin.from("teams").delete().eq("id", team.id);
    go("Tim belum berhasil dibuat. Coba kembali.", "error");
  }
  revalidatePath("/dashboard");
  go("Tim berhasil dibuat. Bagikan kode undangan ke anggota.");
}

export async function joinTeamAction(formData: FormData) {
  const user = await requireUser();
  const code = String(formData.get("joinCode") ?? "").trim().toUpperCase();
  if (!/^[A-F0-9]{8}$/.test(code)) go("Kode tim harus berisi 8 karakter.", "error");

  const admin = createAdminSupabase();
  const [{ data: existing }, { data: team }] = await Promise.all([
    admin.from("team_members").select("team_id").eq("user_id", user.id).maybeSingle(),
    admin.from("teams").select("id").eq("join_code", code).maybeSingle(),
  ]);
  if (existing) go("Kamu sudah tergabung dalam sebuah tim.", "error");
  if (!team) go("Kode tim tidak ditemukan.", "error");

  const { error } = await admin.from("team_members").insert({ team_id: team.id, user_id: user.id });
  if (error) go("Belum berhasil bergabung. Coba kembali.", "error");
  revalidatePath("/dashboard");
  go("Kamu berhasil bergabung dengan tim.");
}

const projectSchema = z.object({
  title: z.string().trim().min(2).max(100),
  tagline: z.string().trim().min(2).max(160),
  description: z.string().trim().min(20).max(3000),
  category: z.string().trim().min(2).max(60),
  boothNumber: z.string().trim().optional(),
  demoUrl: z.string().trim().max(500),
  repoUrl: z.string().trim().max(500),
});

export async function saveProjectAction(formData: FormData) {
  const user = await requireUser();
  const parsed = projectSchema.safeParse({
    title: formData.get("title"),
    tagline: formData.get("tagline"),
    description: formData.get("description"),
    category: formData.get("category"),
    boothNumber: formData.get("boothNumber"),
    demoUrl: formData.get("demoUrl"),
    repoUrl: formData.get("repoUrl"),
  });
  if (!parsed.success) go(parsed.error.issues[0]?.message ?? "Data proyek belum lengkap.", "error");
  if (!isValidHttpUrl(parsed.data.demoUrl) || !isValidHttpUrl(parsed.data.repoUrl)) go("Link demo atau repository tidak valid.", "error");

  const admin = createAdminSupabase();
  const { data: membership } = await admin.from("team_members").select("team_id").eq("user_id", user.id).maybeSingle();
  if (!membership) go("Buat atau gabung tim terlebih dahulu.", "error");
  const { data: team } = await admin.from("teams").select("id, leader_id").eq("id", membership.team_id).single();
  if (!team || team.leader_id !== user.id) go("Hanya ketua tim yang dapat mengubah proyek.", "error");

  const { data: existing } = await admin.from("projects").select("id, slug, cover_url").eq("team_id", team.id).maybeSingle();
  let coverUrl = existing?.cover_url ?? null;
  const cover = formData.get("cover");
  if (cover instanceof File && cover.size > 0) {
    if (cover.size > 3 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(cover.type)) {
      go("Cover harus JPG, PNG, atau WebP dengan ukuran maksimal 3 MB.", "error");
    }
    const extension = cover.type === "image/png" ? "png" : cover.type === "image/webp" ? "webp" : "jpg";
    const path = `${team.id}/${randomUUID()}.${extension}`;
    const { error: uploadError } = await admin.storage.from("project-covers").upload(path, await cover.arrayBuffer(), { contentType: cover.type, upsert: false });
    if (uploadError) go("Cover gagal diunggah. Coba kembali.", "error");
    coverUrl = admin.storage.from("project-covers").getPublicUrl(path).data.publicUrl;
  }

  const boothNumber = parsed.data.boothNumber ? Number(parsed.data.boothNumber) : null;
  if (boothNumber !== null && (!Number.isInteger(boothNumber) || boothNumber < 1 || boothNumber > 99)) go("Nomor booth tidak valid.", "error");
  const slug = existing?.slug ?? `${slugify(parsed.data.title)}-${team.id.slice(0, 6)}`;
  const projectData = {
    team_id: team.id,
    title: parsed.data.title,
    slug,
    tagline: parsed.data.tagline,
    description: parsed.data.description,
    category: parsed.data.category,
    booth_number: boothNumber,
    demo_url: parsed.data.demoUrl || null,
    repo_url: parsed.data.repoUrl || null,
    cover_url: coverUrl,
    status: "submitted" as const,
  };
  const query = existing
    ? admin.from("projects").update(projectData).eq("id", existing.id)
    : admin.from("projects").insert(projectData);
  const { error } = await query;
  if (error?.code === "23505") go("Nomor booth sudah digunakan proyek lain.", "error");
  if (error) go("Proyek belum berhasil disimpan.", "error");
  revalidatePath("/dashboard");
  revalidatePath("/catalog");
  go("Proyek dikirim ke panitia untuk direview.");
}

