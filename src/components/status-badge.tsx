import type { ProjectStatus } from "@/lib/types";

const labels: Record<ProjectStatus, string> = {
  draft: "Draft",
  submitted: "Menunggu review",
  approved: "Sudah tayang",
  rejected: "Perlu revisi",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return <span className={`status-badge status-${status}`}>{labels[status]}</span>;
}

