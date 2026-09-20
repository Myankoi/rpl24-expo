import { notFound } from "next/navigation";
import { ProjectExplorer } from "@/components/project-explorer";
import { getEventBySlug, getEventSettings, getPublicProjects, isPublicEvent } from "@/lib/dal";

export const dynamic = "force-dynamic";

export default async function EditionCatalogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event || !isPublicEvent(event)) notFound();
  const [projects, settings] = await Promise.all([getPublicProjects(event), getEventSettings(event)]);
  return <section className="page-section section-shell"><div className="page-heading"><span className="eyebrow">{event.displayName} · ARCHIVE CATALOG</span><h1>{event.tagline}</h1><p>{projects.length} karya dari {event.venue}. Arsip ini bersifat publik.</p></div><ProjectExplorer projects={projects} votingOpen={settings.votingOpen} /></section>;
}
