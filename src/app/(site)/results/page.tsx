import Link from "next/link";
import { LockClosedIcon, TrophyIcon } from "@heroicons/react/24/outline";
import { getEventSettings, getRanking } from "@/lib/dal";

export const metadata = { title: "Hasil Voting" };
export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const settings = await getEventSettings();
  if (!settings.resultsPublished) {
    return <section className="locked-results section-shell"><div className="locked-icon"><LockClosedIcon /></div><span className="eyebrow">RESULTS LOCKED</span><h1>Hasil masih dirahasiakan.</h1><p>Panitia akan membuka hasil setelah sesi pengumuman juara selesai.</p><Link className="button button-primary" href="/catalog">Kembali ke katalog</Link></section>;
  }
  const ranking = await getRanking();
  const podium = ranking.slice(0, 3);
  return (
    <section className="results-page section-shell">
      <div className="page-heading"><TrophyIcon className="heading-trophy" /><span className="eyebrow">PEOPLE&apos;S CHOICE AWARD</span><h1>Proyek pilihan pengunjung.</h1><p>Selamat kepada seluruh tim yang sudah menciptakan dan memamerkan karyanya.</p></div>
      <div className="public-podium">{[2, 1, 3].map((place) => { const project = podium[place - 1]; return project ? <div className={`public-podium-item public-podium-${place}`} key={project.id}><span>{place}</span><div className="public-medal">{place}</div><h2>{project.title}</h2><p>{project.teamName} · {project.className}</p><strong>{project.voteCount} suara</strong></div> : null; })}</div>
      <div className="ranking-list"><div className="table-heading"><div><span className="kicker">FULL RANKING</span><h2>Perolehan suara</h2></div></div>{ranking.map((project, index) => <div className="ranking-row" key={project.id}><span>{index + 1}</span><div><strong>{project.title}</strong><small>{project.teamName} · Booth {project.boothNumber?.toString().padStart(2, "0") ?? "—"}</small></div><strong>{project.voteCount}<small> suara</small></strong></div>)}</div>
    </section>
  );
}

