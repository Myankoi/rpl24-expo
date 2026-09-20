import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import type {
  AdminOverview,
  DashboardTeam,
  EventSettings,
  EventStatus,
  ExpoEvent,
  Profile,
  ProjectStatus,
  PublicProject,
  RankingProject,
} from "@/lib/types";

type Relation = Record<string, unknown> | Array<Record<string, unknown>> | null;

function one(relation: Relation) {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function toEvent(row: Record<string, unknown>): ExpoEvent {
  return {
    id: String(row.id),
    slug: String(row.slug),
    displayName: String(row.display_name),
    year: Number(row.year),
    tagline: String(row.tagline ?? "Code. Create. Inspire."),
    description: String(row.description ?? ""),
    venue: String(row.venue ?? "SMKN 24 Jakarta"),
    contact: row.contact ? String(row.contact) : null,
    startsAt: row.starts_at ? String(row.starts_at) : null,
    endsAt: row.ends_at ? String(row.ends_at) : null,
    status: String(row.status) as EventStatus,
    isActive: Boolean(row.is_active),
    teamMinSize: Number(row.team_min_size ?? 1),
    teamMaxSize: Number(row.team_max_size ?? 6),
    resultsPublished: Boolean(row.results_published),
  };
}

const publicEventStatuses: EventStatus[] = ["showcase", "voting", "closed", "published", "archived"];

export function isPublicEvent(event: ExpoEvent) {
  return publicEventStatuses.includes(event.status);
}

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const admin = createAdminSupabase();
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, class_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const profileRole = data?.role === "admin" ? "admin" : "participant";
  const isAdmin = profileRole === "admin" || adminEmails().includes(user.email.toLowerCase());

  return {
    id: user.id,
    fullName: data?.full_name ?? user.user_metadata.full_name ?? user.email.split("@")[0],
    className: data?.class_name ?? user.user_metadata.class_name ?? "Belum diisi",
    role: isAdmin ? "admin" : "participant",
    email: user.email,
    isAdmin,
  };
});

export async function requireUser() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?message=Masuk+dulu+untuk+melanjutkan");
  return profile;
}

export async function requireAdmin() {
  const profile = await requireUser();
  if (!profile.isAdmin) redirect("/dashboard?message=Akses+khusus+panitia");
  return profile;
}

export const getActiveEvent = cache(async (): Promise<ExpoEvent> => {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("events")
    .select("id, slug, display_name, year, tagline, description, venue, contact, starts_at, ends_at, status, is_active, team_min_size, team_max_size, results_published")
    .eq("is_active", true)
    .maybeSingle();
  if (error) {
    if (error.code === "PGRST205") throw new Error("Database RPL Expo belum menjalankan migration multi-edition. Terapkan supabase/migrations/20260920120000_multi_event_foundation.sql terlebih dahulu.");
    throw error;
  }
  if (!data) throw new Error("Belum ada edisi aktif.");
  return toEvent(data as unknown as Record<string, unknown>);
});

export async function getEventBySlug(slug: string): Promise<ExpoEvent | null> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("events")
    .select("id, slug, display_name, year, tagline, description, venue, contact, starts_at, ends_at, status, is_active, team_min_size, team_max_size, results_published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? toEvent(data as unknown as Record<string, unknown>) : null;
}

export async function getPublishedEvents(): Promise<ExpoEvent[]> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("events")
    .select("id, slug, display_name, year, tagline, description, venue, contact, starts_at, ends_at, status, is_active, team_min_size, team_max_size, results_published")
    .in("status", ["published", "archived"])
    .order("year", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => toEvent(row as unknown as Record<string, unknown>));
}

export async function getAdminEvents(): Promise<ExpoEvent[]> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("events")
    .select("id, slug, display_name, year, tagline, description, venue, contact, starts_at, ends_at, status, is_active, team_min_size, team_max_size, results_published")
    .order("year", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => toEvent(row as unknown as Record<string, unknown>));
}

export async function getEventSettings(event?: ExpoEvent): Promise<EventSettings> {
  const currentEvent = event ?? await getActiveEvent();
  return {
    eventId: currentEvent.id,
    eventSlug: currentEvent.slug,
    displayName: currentEvent.displayName,
    year: currentEvent.year,
    votingOpen: currentEvent.status === "voting",
    resultsPublished: currentEvent.resultsPublished || currentEvent.status === "published" || currentEvent.status === "archived",
    eventStatus: currentEvent.status,
    status: currentEvent.status,
  };
}

function toPublicProject(row: Record<string, unknown>): PublicProject {
  const team = one(row.teams as Relation);
  return {
    id: String(row.id),
    eventId: row.event_id ? String(row.event_id) : undefined,
    eventSlug: row.event_slug ? String(row.event_slug) : undefined,
    title: String(row.title),
    slug: String(row.slug),
    tagline: String(row.tagline),
    description: String(row.description ?? ""),
    category: String(row.category),
    boothNumber: row.booth_number === null || row.booth_number === undefined ? null : Number(row.booth_number),
    boothLabel: row.booth_label ? String(row.booth_label) : null,
    coverUrl: row.cover_url ? String(row.cover_url) : null,
    demoUrl: row.demo_url ? String(row.demo_url) : null,
    repoUrl: row.repo_url ? String(row.repo_url) : null,
    teamName: String(team?.name ?? "Tim RPL"),
    className: String(team?.class_name ?? "RPL"),
  };
}

const publicProjectSelect = "id, event_id, title, slug, tagline, description, category, booth_number, booth_label, cover_url, demo_url, repo_url, teams!inner(name, class_name)";

export async function getPublicProjects(event?: ExpoEvent, options: { limit?: number } = {}): Promise<PublicProject[]> {
  const currentEvent = event ?? await getActiveEvent();
  if (!isPublicEvent(currentEvent)) return [];
  const admin = createAdminSupabase();
  let query = admin
    .from("projects")
    .select(publicProjectSelect)
    .eq("event_id", currentEvent.id)
    .eq("status", "approved")
    .order("booth_label", { ascending: true, nullsFirst: false })
    .order("title", { ascending: true });
  if (options.limit) query = query.limit(Math.max(1, Math.min(options.limit, 1000)));
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => toPublicProject({ ...(row as Record<string, unknown>), event_slug: currentEvent.slug }));
}

export async function getProjectBySlug(slug: string, event?: ExpoEvent): Promise<PublicProject | null> {
  const currentEvent = event ?? await getActiveEvent();
  if (!isPublicEvent(currentEvent)) return null;
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("projects")
    .select(publicProjectSelect)
    .eq("event_id", currentEvent.id)
    .eq("status", "approved")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? toPublicProject({ ...(data as Record<string, unknown>), event_slug: currentEvent.slug }) : null;
}

export async function getRanking(event?: ExpoEvent): Promise<RankingProject[]> {
  const currentEvent = event ?? await getActiveEvent();
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("projects")
    .select("id, title, slug, tagline, booth_number, booth_label, cover_url, teams!inner(name, class_name), votes(count)")
    .eq("event_id", currentEvent.id)
    .eq("status", "approved");
  if (error) throw error;

  return (data ?? [])
    .map((raw) => {
      const row = raw as unknown as Record<string, unknown>;
      const team = one(row.teams as Relation);
      const voteRelation = one(row.votes as Relation);
      return {
        id: String(row.id),
        title: String(row.title),
        slug: String(row.slug),
        tagline: String(row.tagline),
        boothNumber: row.booth_number === null || row.booth_number === undefined ? null : Number(row.booth_number),
        boothLabel: row.booth_label ? String(row.booth_label) : null,
        coverUrl: row.cover_url ? String(row.cover_url) : null,
        teamName: String(team?.name ?? "Tim RPL"),
        className: String(team?.class_name ?? "RPL"),
        voteCount: Number(voteRelation?.count ?? 0),
      } satisfies RankingProject;
    })
    .sort((a, b) => b.voteCount - a.voteCount || a.title.localeCompare(b.title));
}

export async function getPublishedRanking(event?: ExpoEvent): Promise<Array<RankingProject & { rank: number }>> {
  const currentEvent = event ?? await getActiveEvent();
  const admin = createAdminSupabase();
  const { data, error } = await admin.from("event_results").select("snapshot").eq("event_id", currentEvent.id).maybeSingle();
  if (error) throw error;
  if (Array.isArray(data?.snapshot)) {
    return data.snapshot
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
      .map((item) => ({
        id: String(item.id),
        title: String(item.title),
        slug: String(item.slug),
        tagline: String(item.tagline ?? ""),
        boothNumber: item.boothNumber === null || item.boothNumber === undefined ? null : Number(item.boothNumber),
        boothLabel: item.boothLabel ? String(item.boothLabel) : null,
        coverUrl: item.coverUrl ? String(item.coverUrl) : null,
        teamName: String(item.teamName ?? "Tim RPL"),
        className: String(item.className ?? "RPL"),
        voteCount: Number(item.voteCount ?? 0),
        rank: Number(item.rank ?? 0),
      }));
  }
  const ranking = await getRanking(currentEvent);
  let previousVotes: number | null = null;
  let currentRank = 0;
  return ranking.map((project, index) => {
    if (previousVotes !== project.voteCount) currentRank = index + 1;
    previousVotes = project.voteCount;
    return { ...project, rank: currentRank };
  });
}

export async function getDashboardTeam(userId: string, event?: ExpoEvent): Promise<DashboardTeam | null> {
  const currentEvent = event ?? await getActiveEvent();
  const admin = createAdminSupabase();
  const { data: membership, error: memberError } = await admin
    .from("team_members")
    .select("team_id")
    .eq("event_id", currentEvent.id)
    .eq("user_id", userId)
    .maybeSingle();
  if (memberError) throw memberError;
  if (!membership) return null;

  const [{ data: team, error: teamError }, { data: memberRows, error: membersError }, { data: project, error: projectError }] =
    await Promise.all([
      admin.from("teams").select("id, name, class_name, join_code, leader_id").eq("event_id", currentEvent.id).eq("id", membership.team_id).single(),
      admin.from("team_members").select("user_id, profiles!team_members_user_id_fkey(id, full_name, class_name)").eq("event_id", currentEvent.id).eq("team_id", membership.team_id),
      admin.from("projects").select("id, title, tagline, description, category, booth_number, booth_label, cover_url, demo_url, repo_url, status").eq("event_id", currentEvent.id).eq("team_id", membership.team_id).maybeSingle(),
    ]);
  if (teamError) throw teamError;
  if (membersError) throw membersError;
  if (projectError) throw projectError;

  return {
    eventId: currentEvent.id,
    id: team.id,
    name: team.name,
    className: team.class_name,
    joinCode: team.join_code,
    leaderId: team.leader_id,
    isLeader: team.leader_id === userId,
    members: (memberRows ?? []).map((member) => {
      const relation = one(member.profiles as unknown as Relation);
      return {
        id: String(relation?.id ?? member.user_id),
        fullName: String(relation?.full_name ?? "Anggota tim"),
        className: String(relation?.class_name ?? "RPL"),
      };
    }),
    project: project
      ? {
          id: project.id,
          title: project.title,
          tagline: project.tagline,
          description: project.description,
          category: project.category,
          boothNumber: project.booth_number,
          boothLabel: project.booth_label,
          coverUrl: project.cover_url,
          demoUrl: project.demo_url,
          repoUrl: project.repo_url,
          status: project.status as ProjectStatus,
        }
      : null,
  };
}

export async function getAdminOverview(event?: ExpoEvent): Promise<AdminOverview> {
  const currentEvent = event ?? await getActiveEvent();
  const admin = createAdminSupabase();
  const [projectsResult, projectCountResult, approvedCountResult, voteCountResult, participantCountResult] = await Promise.all([
    admin.from("projects").select("id, title, booth_number, booth_label, status, updated_at, teams!inner(name, class_name), votes(count)").eq("event_id", currentEvent.id).order("updated_at", { ascending: false }),
    admin.from("projects").select("id", { count: "exact", head: true }).eq("event_id", currentEvent.id),
    admin.from("projects").select("id", { count: "exact", head: true }).eq("event_id", currentEvent.id).eq("status", "approved"),
    admin.from("votes").select("id", { count: "exact", head: true }).eq("event_id", currentEvent.id),
    admin.from("event_enrollments").select("user_id", { count: "exact", head: true }).eq("event_id", currentEvent.id),
  ]);
  if (projectsResult.error) throw projectsResult.error;
  const projects = (projectsResult.data ?? []).map((raw) => {
    const row = raw as unknown as Record<string, unknown>;
    const team = one(row.teams as Relation);
    const votes = one(row.votes as Relation);
    return {
      id: String(row.id),
      title: String(row.title),
      teamName: String(team?.name ?? "Tim RPL"),
      className: String(team?.class_name ?? "RPL"),
      boothNumber: row.booth_number === null || row.booth_number === undefined ? null : Number(row.booth_number),
      boothLabel: row.booth_label ? String(row.booth_label) : null,
      status: row.status as ProjectStatus,
      voteCount: Number(votes?.count ?? 0),
      updatedAt: String(row.updated_at),
    };
  });
  return {
    event: currentEvent,
    projects,
    projectCount: projectCountResult.count ?? 0,
    approvedCount: approvedCountResult.count ?? 0,
    voteCount: voteCountResult.count ?? 0,
    participantCount: participantCountResult.count ?? 0,
  };
}
