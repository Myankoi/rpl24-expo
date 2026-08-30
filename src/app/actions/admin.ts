"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/dal";
import { createAdminSupabase } from "@/lib/supabase/admin";

function go(message: string, type: "success" | "error" = "success"): never {
  redirect(`/admin?${type}=${encodeURIComponent(message)}`);
}

export async function updateVotingAction(formData: FormData) {
  await requireAdmin();
  const open = formData.get("open") === "1";
  const admin = createAdminSupabase();
  const patch = open ? { voting_open: true, results_published: false, event_status: "Voting berlangsung" } : { voting_open: false, event_status: "Voting selesai" };
  const { error } = await admin.from("event_settings").update(patch).eq("singleton", true);
  if (error) go("Status voting gagal diubah.", "error");
  revalidatePath("/", "layout");
  go(open ? "Voting dibuka. Pengunjung sudah dapat mengirim suara." : "Voting ditutup. Tidak ada suara baru yang diterima.");
}

export async function updateResultsAction(formData: FormData) {
  await requireAdmin();
  const publish = formData.get("publish") === "1";
  const admin = createAdminSupabase();
  const { data: settings } = await admin.from("event_settings").select("voting_open").eq("singleton", true).single();
  if (publish && settings?.voting_open) go("Tutup voting sebelum mempublikasikan hasil.", "error");
  const { error } = await admin.from("event_settings").update({ results_published: publish }).eq("singleton", true);
  if (error) go("Status hasil gagal diubah.", "error");
  revalidatePath("/results");
  go(publish ? "Hasil juara sudah dapat dilihat publik." : "Hasil kembali disembunyikan.");
}

const projectStatusSchema = z.object({
  projectId: z.uuid(),
  status: z.enum(["submitted", "approved", "rejected"]),
  boothNumber: z.string().trim().optional(),
});

export async function updateProjectStatusAction(formData: FormData) {
  await requireAdmin();
  const parsed = projectStatusSchema.safeParse({
    projectId: formData.get("projectId"),
    status: formData.get("status"),
    boothNumber: formData.get("boothNumber"),
  });
  if (!parsed.success) go("Data review proyek tidak valid.", "error");
  const boothNumber = parsed.data.boothNumber ? Number(parsed.data.boothNumber) : null;
  if (parsed.data.status === "approved" && (!boothNumber || !Number.isInteger(boothNumber) || boothNumber < 1 || boothNumber > 14)) {
    go("Isi nomor booth sebelum menyetujui proyek.", "error");
  }
  const admin = createAdminSupabase();
  const { error } = await admin.from("projects").update({
    status: parsed.data.status,
    booth_number: boothNumber,
    published_at: parsed.data.status === "approved" ? new Date().toISOString() : null,
  }).eq("id", parsed.data.projectId);
  if (error?.code === "23505") go("Nomor booth sudah digunakan proyek lain.", "error");
  if (error) go("Status proyek gagal diperbarui.", "error");
  revalidatePath("/", "layout");
  go(parsed.data.status === "approved" ? "Proyek disetujui dan sudah tayang di katalog." : "Status proyek diperbarui.");
}
