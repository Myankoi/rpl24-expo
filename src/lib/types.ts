export type ProjectStatus = "draft" | "submitted" | "approved" | "rejected";
export type UserRole = "participant" | "admin";

export type EventSettings = {
  votingOpen: boolean;
  resultsPublished: boolean;
  eventStatus: string;
};

export type PublicProject = {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  category: string;
  boothNumber: number | null;
  coverUrl: string | null;
  demoUrl: string | null;
  repoUrl: string | null;
  teamName: string;
  className: string;
};

export type RankingProject = Pick<
  PublicProject,
  "id" | "title" | "slug" | "tagline" | "boothNumber" | "coverUrl" | "teamName" | "className"
> & {
  voteCount: number;
};

export type Profile = {
  id: string;
  fullName: string;
  className: string;
  role: UserRole;
  email: string;
  isAdmin: boolean;
};

export type DashboardTeam = {
  id: string;
  name: string;
  className: string;
  joinCode: string;
  leaderId: string;
  isLeader: boolean;
  members: Array<{ id: string; fullName: string; className: string }>;
  project: {
    id: string;
    title: string;
    tagline: string;
    description: string;
    category: string;
    boothNumber: number | null;
    coverUrl: string | null;
    demoUrl: string | null;
    repoUrl: string | null;
    status: ProjectStatus;
  } | null;
};

export type AdminProject = {
  id: string;
  title: string;
  teamName: string;
  className: string;
  boothNumber: number | null;
  status: ProjectStatus;
  voteCount: number;
  updatedAt: string;
};

export type AdminOverview = {
  projects: AdminProject[];
  projectCount: number;
  approvedCount: number;
  voteCount: number;
  participantCount: number;
};
