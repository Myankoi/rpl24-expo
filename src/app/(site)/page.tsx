import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, BoltIcon } from "@heroicons/react/24/outline";
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
          <span className="eyebrow">RPL EXHIBITION · SMKN 24 JAKARTA</span>
          <h1>From logic to magic.<br /><span>Build the future.</span></h1>
          <p>Jelajahi karya terbaik siswa RPL, temui tim di setiap booth, lalu pilih satu proyek favoritmu.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/catalog">Lihat semua proyek <ArrowRightIcon /></Link>
            <Link className="button button-ghost" href="/vote"><BoltIcon />Vote sekarang</Link>
          </div>
          <div className="hero-stats">
            <div><strong>{projects.length}</strong><span>Proyek tayang</span></div>
            <div><strong>14</strong><span>Total booth</span></div>
            <div><strong>3</strong><span>Angkatan</span></div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-visual-number" aria-hidden="true">24</div>
          <div className="hero-logo-card">
            <div className="hero-logo-stage">
              <Image src="/rpl-smkn24-logo.png" alt="Logo Rekayasa Perangkat Lunak SMK Negeri 24 Jakarta" width={700} height={700} priority sizes="(max-width: 680px) 64vw, (max-width: 980px) 330px, 380px" />
            </div>
            <div className="hero-logo-card-foot"><span>Software Engineering</span><span>Jakarta, Indonesia</span></div>
          </div>
        </div>
      </section>

      <section className="catalog-section section-shell">
        <div className="section-heading"><div><span className="eyebrow">PROJECT SHOWCASE</span><h2>Karya yang siap kamu jelajahi.</h2></div><Link className="text-link" href="/catalog">Katalog lengkap <ArrowRightIcon /></Link></div>
        <ProjectExplorer projects={projects.slice(0, 6)} votingOpen={settings.votingOpen} compact />
      </section>
    </>
  );
}
