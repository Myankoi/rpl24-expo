import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowTopRightOnSquareIcon, CodeBracketIcon } from "@heroicons/react/24/outline";
import { QuickVote } from "@/components/quick-vote";
import { getEventSettings, getProjectBySlug } from "@/lib/dal";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const [project, settings] = await Promise.all([getProjectBySlug(slug), getEventSettings()]);
  if (!project) notFound();
  return (
    <section className="project-detail section-shell">
      <Link className="back-link" href="/catalog"><ArrowLeftIcon />Kembali ke katalog</Link>
      <div className="project-detail-grid">
        <div className="detail-visual">
          {project.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.coverUrl} alt={`Cover ${project.title}`} />
          ) : <div className="detail-placeholder"><span>{project.boothNumber?.toString().padStart(2, "0") ?? "RPL"}</span><small>PROJECT</small></div>}
          <span className="detail-booth">BOOTH {project.boothNumber?.toString().padStart(2, "0") ?? "—"}</span>
        </div>
        <div className="detail-copy">
          <span className="eyebrow">{project.category}</span><h1>{project.title}</h1><p className="detail-tagline">{project.tagline}</p>
          <div className="detail-team"><span>Dibuat oleh</span><strong>{project.teamName}</strong><small>{project.className}</small></div>
          <div className="detail-description"><h2>Tentang proyek</h2>{project.description.split("\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
          <div className="detail-actions">
            {project.demoUrl && <a className="button button-ghost" href={project.demoUrl} target="_blank" rel="noreferrer"><ArrowTopRightOnSquareIcon />Buka demo</a>}
            {project.repoUrl && <a className="button button-ghost" href={project.repoUrl} target="_blank" rel="noreferrer"><CodeBracketIcon />Repository</a>}
          </div>
          <div className="detail-vote"><QuickVote project={project} votingOpen={settings.votingOpen} /></div>
        </div>
      </div>
    </section>
  );
}
