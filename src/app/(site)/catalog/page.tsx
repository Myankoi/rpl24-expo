import { ProjectExplorer } from "@/components/project-explorer";
import { getEventSettings, getPublicProjects } from "@/lib/dal";

export const metadata = { title: "Katalog Proyek" };
export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const [projects, settings] = await Promise.all([getPublicProjects(), getEventSettings()]);
  return (
    <section className="page-section section-shell">
      <div className="page-heading"><span className="eyebrow">DIGITAL PROJECT CATALOG</span><h1>Temukan proyek favoritmu.</h1><p>{projects.length} karya dari siswa RPL. Buka detailnya, kunjungi booth, lalu berikan satu suara.</p></div>
      <ProjectExplorer projects={projects} votingOpen={settings.votingOpen} />
    </section>
  );
}

