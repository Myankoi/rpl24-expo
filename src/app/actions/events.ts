"use server";

import { createHmac } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/dal";
import { createAdminSupabase } from "@/lib/supabase/admin";

function go(message: string, type: "success" | "error" = "success"): never {
  redirect(`/admin/events?${type}=${encodeURIComponent(message)}`);
}

function enrollmentHash(code: string) {
  const secret = process.env.ENROLLMENT_CODE_SECRET ?? process.env.VOTER_HASH_SECRET;
  if (!secret || secret.length < 32) return null;
  return createHmac("sha256", secret).update(code.trim().toUpperCase()).digest("hex");
}

const eventSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung."),
  displayName: z.string().trim().min(2).max(120),
  year: z.coerce.number().int().min(2000).max(2200),
  tagline: z.string().trim().min(2).max(160),
  venue: z.string().trim().min(2).max(120),
  teamMinSize: z.coerce.number().int().min(1).max(50),
  teamMaxSize: z.coerce.number().int().min(1).max(50),
  enrollmentCode: z.string().trim().min(8).max(100),
}).refine((value) => value.teamMaxSize >= value.teamMinSize, {
  message: "Ukuran maksimal tim harus sama atau lebih besar dari ukuran minimal.",
  path: ["teamMaxSize"],
});

export async function createEventAction(formData: FormData) {
  const adminUser = await requireAdmin();
  const parsed = eventSchema.safeParse({
    slug: formData.get("slug"),
    displayName: formData.get("displayName"),
    year: formData.get("year"),
    tagline: formData.get("tagline"),
    venue: formData.get("venue"),
    teamMinSize: formData.get("teamMinSize"),
    teamMaxSize: formData.get("teamMaxSize"),
    enrollmentCode: formData.get("enrollmentCode"),
  });
  if (!parsed.success) go(parsed.error.issues[0]?.message ?? "Data edisi belum lengkap.", "error");
  const enrollmentCodeHash = enrollmentHash(parsed.data.enrollmentCode);
  if (!enrollmentCodeHash) go("ENROLLMENT_CODE_SECRET belum dikonfigurasi minimal 32 karakter.", "error");

  const admin = createAdminSupabase();
  const { error } = await admin.from("events").insert({
    slug: parsed.data.slug,
    display_name: parsed.data.displayName,
    year: parsed.data.year,
    tagline: parsed.data.tagline,
    venue: parsed.data.venue,
    status: "draft",
    is_active: false,
    team_min_size: parsed.data.teamMinSize,
    team_max_size: parsed.data.teamMaxSize,
    enrollment_code_hash: enrollmentCodeHash,
    created_by: adminUser.id,
  });
  if (error?.code === "23505") go("Slug edisi sudah digunakan.", "error");
  if (error) go("Edisi baru gagal dibuat.", "error");
  revalidatePath("/admin/events");
  go("Edisi baru dibuat sebagai draft. Aktifkan saat siap pendaftaran.");
}

export async function activateEventAction(formData: FormData) {
  const adminUser = await requireAdmin();
  const eventId = z.uuid().safeParse(formData.get("eventId"));
  if (!eventId.success) go("Edisi tidak valid.", "error");

  const admin = createAdminSupabase();
  const { data: target, error: targetError } = await admin.from("events").select("id, status, is_active").eq("id", eventId.data).maybeSingle();
  if (targetError || !target) go("Edisi tidak ditemukan.", "error");
  if (target.status === "archived") go("Edisi yang sudah diarsipkan tidak dapat diaktifkan.", "error");
  if (target.is_active) go("Edisi ini sudah aktif.");

  const { data: current } = await admin.from("events").select("id, status").eq("is_active", true).maybeSingle();
  if (current && !["published", "archived"].includes(current.status)) go("Publikasikan atau arsipkan edisi aktif sebelum menggantinya.", "error");
  if (current?.id) {
    const { error } = await admin.from("events").update({ is_active: false }).eq("id", current.id);
    if (error) go("Edisi aktif saat ini gagal dinonaktifkan.", "error");
  }

  const { error: activateError } = await admin.from("events").update({ is_active: true, status: target.status === "draft" ? "registration" : target.status }).eq("id", eventId.data);
  if (activateError) {
    if (current?.id) await admin.from("events").update({ is_active: true }).eq("id", current.id);
    go("Edisi baru gagal diaktifkan.", "error");
  }
  await admin.from("audit_logs").insert({ event_id: eventId.data, actor_id: adminUser.id, action: "event.activate", entity_type: "event", entity_id: eventId.data });
  revalidatePath("/", "layout");
  revalidatePath("/admin/events");
  go("Edisi aktif berhasil diganti.");
}
