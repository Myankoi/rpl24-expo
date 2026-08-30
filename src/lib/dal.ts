import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import type {
  AdminOverview,
  DashboardTeam,
  EventSettings,
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

export async function getEventSettings(): Promise<EventSettings> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("event_settings")
    .select("voting_open, results_published, event_status")
    .eq("singleton", true)
    .single();
  if (error) throw error;
  return {
    votingOpen: data.voting_open,
    resultsPublished: data.results_published,
    eventStatus: data.event_status,
  };
}

function toPublicProject(row: Record<string, unknown>): PublicProject {
  const team = one(row.teams as Relation);
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    tagline: String(row.tagline),
    description: String(row.description),
    category: String(row.category),
    boothNumber: row.booth_number === null ? null : Number(row.booth_number),
    coverUrl: row.cover_url ? String(row.cover_url) : null,
    demoUrl: row.demo_url ? String(row.demo_url) : null,
    repoUrl: row.repo_url ? String(row.repo_url) : null,
    teamName: String(team?.name ?? "Tim RPL"),
    className: String(team?.class_name ?? "RPL"),
  };
}

export async function getPublicProjects(): Promise<PublicProject[]> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("projects")
    .select("id, title, slug, tagline, description, category, booth_number, cover_url, demo_url, repo_url, teams!inner(name, class_name)")
    .eq("status", "approved")
    .order("booth_number", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map((row) => toPublicProject(row as unknown as Record<string, unknown>));
}

export async function getProjectBySlug(slug: string): Promise<PublicProject | null> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("projects")
    .select("id, title, slug, tagline, description, category, booth_number, cover_url, demo_url, repo_url, teams!inner(name, class_name)")
    .eq("status", "approved")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? toPublicProject(data as unknown as Record<string, unknown>) : null;
}

export async function getRanking(): Promise<RankingProject[]> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("projects")
    .select("id, title, slug, tagline, booth_number, cover_url, teams!inner(name, class_name), votes(count)")
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
        boothNumber: row.booth_number === null ? null : Number(row.booth_number),
        coverUrl: row.cover_url ? String(row.cover_url) : null,
        teamName: String(team?.name ?? "Tim RPL"),
        className: String(team?.class_name ?? "RPL"),
        voteCount: Number(voteRelation?.count ?? 0),
      } satisfies RankingProject;
    })
    .sort((a, b) => b.voteCount - a.voteCount || a.title.localeCompare(b.title));
}

export async function getDashboardTeam(userId: string): Promise<DashboardTeam | null> {
  const admin = createAdminSupabase();
  const { data: membership, error: memberError } = await admin
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (memberError) throw memberError;
  if (!membership) return null;

  const [{ data: team, error: teamError }, { data: memberRows, error: membersError }, { data: project, error: projectError }] =
    await Promise.all([
      admin.from("teams").select("id, name, class_name, join_code, leader_id").eq("id", membership.team_id).single(),
      admin.from("team_members").select("user_id, profiles!team_members_user_id_fkey(id, full_name, class_name)").eq("team_id", membership.team_id),
      admin.from("projects").select("id, title, tagline, description, category, booth_number, cover_url, demo_url, repo_url, status").eq("team_id", membership.team_id).maybeSingle(),
    ]);
  if (teamError) throw teamError;
  if (membersError) throw membersError;
  if (projectError) throw projectError;

  return {
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
          coverUrl: project.cover_url,
          demoUrl: project.demo_url,
          repoUrl: project.repo_url,
          status: project.status as ProjectStatus,
        }
      : null,
  };
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const admin = createAdminSupabase();
  const [projectsResult, projectCountResult, approvedCountResult, voteCountResult, participantCountResult] = await Promise.all([
    admin.from("projects").select("id, title, booth_number, status, updated_at, teams!inner(name, class_name), votes(count)").order("updated_at", { ascending: false }),
    admin.from("projects").select("id", { count: "exact", head: true }),
    admin.from("projects").select("id", { count: "exact", head: true }).eq("status", "approved"),
    admin.from("votes").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }),
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
      boothNumber: row.booth_number === null ? null : Number(row.booth_number),
      status: row.status as ProjectStatus,
      voteCount: Number(votes?.count ?? 0),
      updatedAt: String(row.updated_at),
    };
  });
  return {
    projects,
    projectCount: projectCountResult.count ?? 0,
    approvedCount: approvedCountResult.count ?? 0,
    voteCount: voteCountResult.count ?? 0,
    participantCount: participantCountResult.count ?? 0,
  };
}
