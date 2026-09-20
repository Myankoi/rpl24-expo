import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowTopRightOnSquareIcon, CodeBracketIcon } from "@heroicons/react/24/outline";
import { QuickVote } from "@/components/quick-vote";
import { getActiveEvent, getEventSettings, getProjectBySlug } from "@/lib/dal";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  return project ? { title: project.title, description: project.tagline, alternates: { canonical: `/projects/${slug}` }, openGraph: { title: project.title, description: project.tagline, images: project.coverUrl ? [project.coverUrl] : undefined } } : { title: "Proyek tidak ditemukan" };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const [event, project, settings] = await Promise.all([getActiveEvent(), getProjectBySlug(slug), getEventSettings()]);
  if (!project) notFound();
  return (
    <section className="project-detail section-shell">
      <Link className="back-link" href="/catalog"><ArrowLeftIcon />Kembali ke katalog</Link>
      <div className="project-detail-grid">
        <div className="detail-visual">
          {project.coverUrl ? (
            <Image src={project.coverUrl} alt={`Cover ${project.title}`} width={900} height={900} sizes="(max-width: 900px) 100vw, 50vw" />
          ) : <div className="detail-placeholder"><span>{project.boothLabel ?? project.boothNumber?.toString().padStart(2, "0") ?? "RPL"}</span><small>PROJECT</small></div>}
          <span className="detail-booth">BOOTH {project.boothLabel ?? project.boothNumber?.toString().padStart(2, "0") ?? "—"}</span>
        </div>
          <div className="detail-copy">
          <span className="eyebrow">{project.category}</span><h1>{project.title}</h1><p className="detail-tagline">{project.tagline}</p>
          <div className="detail-team"><span>{event.displayName}</span><strong>{project.teamName}</strong><small>{project.className}</small></div>
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
