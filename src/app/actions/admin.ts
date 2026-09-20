"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getActiveEvent, getRanking, requireAdmin } from "@/lib/dal";
import { createAdminSupabase } from "@/lib/supabase/admin";

function go(message: string, type: "success" | "error" = "success"): never {
  redirect(`/admin?${type}=${encodeURIComponent(message)}`);
}

async function audit(eventId: string, actorId: string, action: string, entityType: string, entityId?: string, metadata: Record<string, unknown> = {}) {
  await createAdminSupabase().from("audit_logs").insert({
    event_id: eventId,
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    metadata,
  });
}

async function syncLegacySettings(event: Awaited<ReturnType<typeof getActiveEvent>>, status: string, resultsPublished: boolean) {
  if (event.slug !== "rpl-expo-2026") return;
  const labels: Record<string, string> = {
    draft: "Persiapan",
    registration: "Pendaftaran",
    review: "Review",
    showcase: "Showcase",
    voting: "Voting berlangsung",
    closed: "Voting selesai",
    published: "Hasil dipublikasikan",
    archived: "Diarsipkan",
  };
  await createAdminSupabase().from("event_settings").update({
    voting_open: status === "voting",
    results_published: resultsPublished,
    event_status: labels[status] ?? status,
  }).eq("singleton", true);
}

export async function updateVotingAction(formData: FormData) {
  const adminUser = await requireAdmin();
  const event = await getActiveEvent();
  const open = formData.get("open") === "1";
  if (open && !["showcase", "closed"].includes(event.status)) go("Voting hanya dapat dibuka dari fase showcase atau closed.", "error");
  if (!open && event.status !== "voting") go("Voting sedang tidak aktif.", "error");

  const admin = createAdminSupabase();
  const nextStatus = open ? "voting" : "closed";
  const { error } = await admin.from("events").update({ status: nextStatus, results_published: false }).eq("id", event.id).eq("is_active", true);
  if (error) go("Status voting gagal diubah.", "error");
  await syncLegacySettings(event, nextStatus, false);
  await audit(event.id, adminUser.id, open ? "voting.open" : "voting.close", "event", event.id);
  revalidatePath("/", "layout");
  go(open ? "Voting dibuka. Pengunjung sudah dapat mengirim suara." : "Voting ditutup. Tidak ada suara baru yang diterima.");
}

export async function updateResultsAction(formData: FormData) {
  const adminUser = await requireAdmin();
  const event = await getActiveEvent();
  const publish = formData.get("publish") === "1";
  if (publish && event.status !== "closed") go("Tutup voting sebelum mempublikasikan hasil.", "error");
  if (!publish && event.status !== "published") go("Hasil belum dipublikasikan.", "error");

  const admin = createAdminSupabase();
  if (publish) {
    const ranking = await getRanking(event);
    let previousVotes: number | null = null;
    let currentRank = 0;
    const snapshot = ranking.map((project, index) => {
      if (previousVotes !== project.voteCount) currentRank = index + 1;
      previousVotes = project.voteCount;
      return { ...project, rank: currentRank };
    });
    const { error: resultError } = await admin.from("event_results").upsert({
      event_id: event.id,
      snapshot,
      published_by: adminUser.id,
      published_at: new Date().toISOString(),
    }, { onConflict: "event_id" });
    if (resultError) go("Snapshot hasil gagal dibuat.", "error");
  }
  const { error } = await admin.from("events").update({ status: publish ? "published" : "closed", results_published: publish }).eq("id", event.id);
  if (error) go("Status hasil gagal diubah.", "error");
  await syncLegacySettings(event, publish ? "published" : "closed", publish);
  await audit(event.id, adminUser.id, publish ? "results.publish" : "results.hide", "event", event.id);
  revalidatePath("/results");
  go(publish ? "Hasil juara sudah dapat dilihat publik." : "Hasil kembali disembunyikan.");
}

const projectStatusSchema = z.object({
  projectId: z.uuid(),
  status: z.enum(["submitted", "changes_requested", "approved", "rejected"]),
  boothLabel: z.string().trim().max(30).optional(),
});

const eventStatusSchema = z.enum(["draft", "registration", "review", "showcase", "voting", "closed", "published", "archived"]);

const allowedEventTransitions: Record<string, string[]> = {
  draft: ["registration"],
  registration: ["review"],
  review: ["showcase"],
  showcase: ["voting"],
  voting: ["closed"],
  closed: ["voting", "published"],
  published: ["archived"],
  archived: [],
};

export async function updateEventStatusAction(formData: FormData) {
  const adminUser = await requireAdmin();
  const event = await getActiveEvent();
  const parsed = eventStatusSchema.safeParse(formData.get("status"));
  if (!parsed.success || !allowedEventTransitions[event.status]?.includes(parsed.data)) go("Transisi fase event tidak diizinkan.", "error");
  if (parsed.data === "showcase") {
    const { count } = await createAdminSupabase().from("projects").select("id", { count: "exact", head: true }).eq("event_id", event.id).in("status", ["submitted", "changes_requested"]);
    if ((count ?? 0) > 0) go("Selesaikan review seluruh proyek sebelum mengunci showcase.", "error");
  }
  const admin = createAdminSupabase();
  const { error } = await admin.from("events").update({ status: parsed.data, results_published: parsed.data === "published" }).eq("id", event.id).eq("is_active", true);
  if (error) go("Fase event gagal diubah.", "error");
  await syncLegacySettings(event, parsed.data, parsed.data === "published");
  await audit(event.id, adminUser.id, "event.transition", "event", event.id, { from: event.status, to: parsed.data });
  revalidatePath("/", "layout");
  go(`Fase event diubah ke ${parsed.data}.`);
}

export async function updateProjectStatusAction(formData: FormData) {
  const adminUser = await requireAdmin();
  const event = await getActiveEvent();
  if (!["registration", "review"].includes(event.status)) go("Review proyek dikunci setelah fase review selesai.", "error");
  const parsed = projectStatusSchema.safeParse({
    projectId: formData.get("projectId"),
    status: formData.get("status"),
    boothLabel: formData.get("boothLabel") ?? formData.get("boothNumber"),
  });
  if (!parsed.success) go("Data review proyek tidak valid.", "error");
  const boothLabel = parsed.data.boothLabel || null;
  if (parsed.data.status === "approved" && !boothLabel) go("Isi kode booth sebelum menyetujui proyek.", "error");

  const admin = createAdminSupabase();
  let boothId: string | null = null;
  if (boothLabel) {
    const { data: booth, error: boothError } = await admin.from("booths").upsert({ event_id: event.id, code: boothLabel, sort_order: 0 }, { onConflict: "event_id,code" }).select("id").single();
    if (boothError || !booth) go("Kode booth gagal disimpan.", "error");
    boothId = booth.id;
  }
  const { error } = await admin.from("projects").update({
    status: parsed.data.status,
    booth_label: boothLabel,
    booth_id: boothId,
    published_at: parsed.data.status === "approved" ? new Date().toISOString() : null,
  }).eq("id", parsed.data.projectId).eq("event_id", event.id);
  if (error?.code === "23505") go("Kode booth sudah digunakan proyek lain pada edisi ini.", "error");
  if (error) go("Status proyek gagal diperbarui.", "error");
  await audit(event.id, adminUser.id, `project.${parsed.data.status}`, "project", parsed.data.projectId, { boothLabel });
  revalidatePath("/", "layout");
  go(parsed.data.status === "approved" ? "Proyek disetujui dan sudah tayang di katalog." : "Status proyek diperbarui.");
}
