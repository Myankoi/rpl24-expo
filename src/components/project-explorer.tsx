"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, CheckCircleIcon, FunnelIcon, MagnifyingGlassIcon, RocketLaunchIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import type { PublicProject } from "@/lib/types";
import { hasVotedLocally } from "@/lib/fingerprint";
import { VoteModal } from "@/components/vote-modal";

function ProjectCover({ project }: { project: PublicProject }) {
  return project.coverUrl ? (
    // Supabase Storage URLs are dynamic; the image remains public and responsive.
    // eslint-disable-next-line @next/next/no-img-element
    <img className="project-cover" src={project.coverUrl} alt={`Cover ${project.title}`} />
  ) : (
    <div className="project-cover project-cover-fallback"><span>{project.boothLabel ?? project.boothNumber?.toString().padStart(2, "0") ?? "RPL"}</span><small>PROJECT</small></div>
  );
}

export function ProjectExplorer({ projects, votingOpen, compact = false }: { projects: PublicProject[]; votingOpen: boolean; compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [selected, setSelected] = useState<PublicProject | null>(null);
  const [voted, setVoted] = useState(false);
  const closeModal = useCallback(() => { setSelected(null); setVoted(hasVotedLocally(projects[0]?.eventSlug ?? "active")); }, [projects]);
  const categories = useMemo(() => ["Semua", ...Array.from(new Set(projects.map((project) => project.category)))], [projects]);
  const visible = useMemo(() => projects.filter((project) => {
    const keyword = query.toLowerCase();
    const matchesText = `${project.title} ${project.teamName} ${project.className} ${project.tagline}`.toLowerCase().includes(keyword);
    return matchesText && (category === "Semua" || project.category === category);
  }), [projects, query, category]);

  useEffect(() => {
    // localStorage is an external client-only source of truth for the badge.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVoted(hasVotedLocally(projects[0]?.eventSlug ?? "active"));
  }, [projects]);

  return (
    <>
      {!compact && projects.length > 0 && (
        <div className="catalog-tools">
          <label className="search-shell"><MagnifyingGlassIcon /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari proyek atau tim..." /></label>
          <label className="filter-shell"><FunnelIcon /><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
      )}
      {visible.length ? (
        <div className="project-grid">
          {visible.map((project) => (
            <article className="project-card" key={project.id}>
              <ProjectCover project={project} />
              <div className="project-card-body">
                <div className="project-meta"><span>Booth {project.boothLabel ?? project.boothNumber?.toString().padStart(2, "0") ?? "—"}</span><span>{project.category}</span></div>
                <h3>{project.title}</h3>
                <p>{project.tagline}</p>
                <div className="project-team"><strong>{project.teamName}</strong><span>{project.className}</span></div>
                <div className="project-actions">
                  <Link className="button button-ghost button-compact" href={project.eventSlug ? `/editions/${project.eventSlug}/projects/${project.slug}` : `/projects/${project.slug}`}>Detail <ArrowRightIcon /></Link>
                  {voted ? (
                    <span className="badge badge-voted"><CheckCircleIcon />Sudah voting</span>
                  ) : (
                    <button className="button button-primary button-compact" type="button" onClick={() => setSelected(project)} disabled={!votingOpen}><RocketLaunchIcon />{votingOpen ? "Vote" : "Ditutup"}</button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state"><Squares2X2Icon /><h3>{projects.length ? "Proyek tidak ditemukan" : "Katalog sedang disiapkan"}</h3><p>{projects.length ? "Coba kata kunci atau kategori lain." : "Proyek yang disetujui panitia akan muncul di sini."}</p></div>
      )}
      <VoteModal project={selected} onClose={closeModal} />
    </>
  );
}
