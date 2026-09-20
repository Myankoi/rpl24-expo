import type { ProjectStatus } from "@/lib/types";

const labels: Record<ProjectStatus, string> = {
  draft: "Draft",
  submitted: "Menunggu review",
  changes_requested: "Perlu revisi",
  approved: "Sudah tayang",
  rejected: "Ditolak",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return <span className={`status-badge status-${status}`}>{labels[status]}</span>;
}
