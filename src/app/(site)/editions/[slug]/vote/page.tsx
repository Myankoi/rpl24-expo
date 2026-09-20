import { notFound } from "next/navigation";
import { ProjectExplorer } from "@/components/project-explorer";
import { getEventBySlug, getEventSettings, getPublicProjects, isPublicEvent } from "@/lib/dal";

export const dynamic = "force-dynamic";

export default async function EditionVotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event || !isPublicEvent(event)) notFound();
  const [projects, settings] = await Promise.all([getPublicProjects(event), getEventSettings(event)]);
  return <section className="page-section section-shell"><div className="page-heading voting-heading"><span className="eyebrow">{event.displayName} · PEOPLE&apos;S CHOICE</span><h1>{settings.votingOpen ? "Satu tiket. Satu suara." : "Voting sudah ditutup."}</h1><p>{settings.votingOpen ? "Pilih proyek, masukkan kode tiket pengunjung, lalu konfirmasi." : "Edisi ini tetap dapat dijelajahi sebagai arsip."}</p></div><ProjectExplorer projects={projects} votingOpen={settings.votingOpen} /></section>;
}
