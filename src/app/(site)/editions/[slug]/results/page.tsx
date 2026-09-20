import Link from "next/link";
import { notFound } from "next/navigation";
import { LockClosedIcon, TrophyIcon } from "@heroicons/react/24/outline";
import { getEventBySlug, getEventSettings, getPublishedRanking } from "@/lib/dal";

export const dynamic = "force-dynamic";

export default async function EditionResultsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();
  const settings = await getEventSettings(event);
  if (!settings.resultsPublished) return <section className="locked-results section-shell"><div className="locked-icon"><LockClosedIcon /></div><span className="eyebrow">RESULTS LOCKED</span><h1>Hasil masih dirahasiakan.</h1><p>Hasil akan tersedia setelah panitia mempublikasikan snapshot edisi ini.</p><Link className="button button-primary" href={`/editions/${event.slug}/catalog`}>Kembali ke katalog</Link></section>;
  const ranking = await getPublishedRanking(event);
  return <section className="results-page section-shell"><div className="page-heading"><TrophyIcon className="heading-trophy" /><span className="eyebrow">{event.displayName} · PEOPLE&apos;S CHOICE</span><h1>Proyek pilihan pengunjung.</h1><p>Arsip ranking dan jumlah suara edisi ini.</p></div><div className="ranking-list"><div className="table-heading"><div><span className="kicker">FULL RANKING</span><h2>Perolehan suara</h2></div></div>{ranking.map((project) => <div className="ranking-row" key={project.id}><span>{project.rank}</span><div><strong>{project.title}</strong><small>{project.teamName} · Booth {project.boothLabel ?? project.boothNumber ?? "—"}</small></div><strong>{project.voteCount}<small> suara</small></strong></div>)}</div></section>;
}
