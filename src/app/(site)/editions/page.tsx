import Link from "next/link";
import { ArrowRightIcon, ArchiveBoxIcon } from "@heroicons/react/24/outline";
import { getPublishedEvents } from "@/lib/dal";

export const metadata = { title: "Arsip Edisi" };
export const dynamic = "force-dynamic";

export default async function EditionsPage() {
  const events = await getPublishedEvents();
  return <section className="page-section section-shell"><div className="page-heading"><span className="eyebrow">RPL EXPO ARCHIVE</span><h1>Jelajahi edisi sebelumnya.</h1><p>Setiap edisi menyimpan karya, tim, dan hasil People&apos;s Choice secara terpisah.</p></div>{events.length ? <div className="project-grid">{events.map((event) => <article className="dashboard-card" key={event.id}><ArchiveBoxIcon className="card-icon" /><span className="kicker">{event.year} · {event.status}</span><h2>{event.displayName}</h2><p>{event.venue}</p><Link className="button button-ghost button-compact" href={`/editions/${event.slug}/catalog`}>Buka arsip <ArrowRightIcon /></Link></article>)}</div> : <div className="empty-state"><ArchiveBoxIcon /><h3>Belum ada arsip</h3><p>Edisi yang sudah dipublikasikan akan tampil di sini.</p></div>}</section>;
}
