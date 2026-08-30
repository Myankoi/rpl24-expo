import Link from "next/link";
import { ArrowRightIcon, BoltIcon, CheckBadgeIcon, Squares2X2Icon, UserGroupIcon } from "@heroicons/react/24/outline";
import { ProjectExplorer } from "@/components/project-explorer";
import { getEventSettings, getPublicProjects } from "@/lib/dal";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [projects, settings] = await Promise.all([getPublicProjects(), getEventSettings()]);
  return (
    <>
      <section className="hero section-shell">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <div className="event-pill"><span className={settings.votingOpen ? "live-dot" : "live-dot is-off"} />{settings.votingOpen ? "Voting sedang dibuka" : settings.eventStatus}</div>
          <span className="eyebrow">RPL EXHIBITION 2026</span>
          <h1>From logic to magic.<br /><span>Build the future.</span></h1>
          <p>Jelajahi karya terbaik siswa RPL, temui tim di setiap booth, lalu pilih satu proyek favoritmu.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/catalog">Lihat semua proyek <ArrowRightIcon /></Link>
            <Link className="button button-ghost" href="/vote"><BoltIcon />Vote sekarang</Link>
          </div>
          <div className="hero-stats">
            <div><strong>14</strong><span>Booth proyek</span></div>
            <div><strong>3</strong><span>Angkatan RPL</span></div>
            <div><strong>1</strong><span>People&apos;s choice</span></div>
          </div>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="hero-core"><Squares2X2Icon /><span>RPL</span><small>EXPO</small></div>
          <div className="float-card float-card-one"><CheckBadgeIcon /><span>Real projects</span></div>
          <div className="float-card float-card-two"><UserGroupIcon /><span>People&apos;s choice</span></div>
        </div>
      </section>

      <section className="catalog-section section-shell">
        <div className="section-heading"><div><span className="eyebrow">PROJECT SHOWCASE</span><h2>Karya yang siap kamu jelajahi.</h2></div><Link className="text-link" href="/catalog">Katalog lengkap <ArrowRightIcon /></Link></div>
        <ProjectExplorer projects={projects.slice(0, 6)} votingOpen={settings.votingOpen} compact />
      </section>
    </>
  );
}
