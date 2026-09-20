export type ProjectStatus = "draft" | "submitted" | "changes_requested" | "approved" | "rejected";
export type UserRole = "participant" | "admin";
export type EventStatus = "draft" | "registration" | "review" | "showcase" | "voting" | "closed" | "published" | "archived";

export type ExpoEvent = {
  id: string;
  slug: string;
  displayName: string;
  year: number;
  tagline: string;
  description: string;
  venue: string;
  contact: string | null;
  startsAt: string | null;
  endsAt: string | null;
  status: EventStatus;
  isActive: boolean;
  teamMinSize: number;
  teamMaxSize: number;
  resultsPublished: boolean;
};

export type EventSettings = {
  eventId: string;
  eventSlug: string;
  displayName: string;
  year: number;
  votingOpen: boolean;
  resultsPublished: boolean;
  eventStatus: string;
  status: EventStatus;
};

export type PublicProject = {
  id: string;
  eventId?: string;
  eventSlug?: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  category: string;
  boothNumber: number | null;
  boothLabel?: string | null;
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
  boothLabel?: string | null;
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
  eventId?: string;
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
    boothLabel?: string | null;
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
  boothLabel?: string | null;
  status: ProjectStatus;
  voteCount: number;
  updatedAt: string;
};

export type AdminOverview = {
  event?: ExpoEvent;
  projects: AdminProject[];
  projectCount: number;
  approvedCount: number;
  voteCount: number;
  participantCount: number;
};
