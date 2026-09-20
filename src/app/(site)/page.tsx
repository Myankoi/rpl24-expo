import Link from "next/link";
import { ArrowRightIcon, BoltIcon } from "@heroicons/react/24/outline";
import { InteractiveLogoCard } from "@/components/interactive-logo-card";
import { ProjectExplorer } from "@/components/project-explorer";
import { getActiveEvent, getEventSettings, getPublicProjects } from "@/lib/dal";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [event, projects, settings] = await Promise.all([getActiveEvent(), getPublicProjects(undefined, { limit: 6 }), getEventSettings()]);
  return (
    <>
      <section className="hero section-shell">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <span className="eyebrow">{event.displayName} · {event.venue}</span>
          <h1>From logic to magic.<br /><span>Build the future.</span></h1>
          <p>{event.description || "Jelajahi karya terbaik siswa RPL, temui tim di setiap booth, lalu pilih satu proyek favoritmu."}</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/catalog">Lihat semua proyek <ArrowRightIcon /></Link>
            <Link className="button button-ghost" href="/vote"><BoltIcon />Vote sekarang</Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-visual-number" aria-hidden="true">24</div>
          <InteractiveLogoCard />
        </div>
      </section>

      <section className="catalog-section section-shell">
        <div className="section-heading"><div><span className="eyebrow">PROJECT SHOWCASE</span><h2>Karya yang siap kamu jelajahi.</h2></div><Link className="text-link" href="/catalog">Katalog lengkap <ArrowRightIcon /></Link></div>
        <ProjectExplorer projects={projects} votingOpen={settings.votingOpen} compact />
      </section>
    </>
  );
}
