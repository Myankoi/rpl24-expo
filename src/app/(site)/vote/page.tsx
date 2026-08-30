import { ProjectExplorer } from "@/components/project-explorer";
import { getEventSettings, getPublicProjects } from "@/lib/dal";

export const metadata = { title: "Voting" };
export const dynamic = "force-dynamic";

export default async function VotePage() {
  const [projects, settings] = await Promise.all([getPublicProjects(), getEventSettings()]);
  return (
    <section className="page-section section-shell">
      <div className="page-heading voting-heading">
        <span className="eyebrow">PEOPLE&apos;S CHOICE AWARD</span>
        <h1>{settings.votingOpen ? "Satu perangkat. Satu suara." : "Voting belum dibuka."}</h1>
        <p>{settings.votingOpen ? "Pilih proyek, tap vote, konfirmasi — selesai. Tidak perlu membuat akun." : "Kamu tetap bisa melihat semua proyek sambil menunggu panitia membuka voting."}</p>
      </div>
      <ProjectExplorer projects={projects} votingOpen={settings.votingOpen} />
    </section>
  );
}
