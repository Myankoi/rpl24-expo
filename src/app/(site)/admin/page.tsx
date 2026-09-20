import Link from "next/link";
import { ArchiveBoxIcon, ArrowRightStartOnRectangleIcon, ChartBarIcon, CheckBadgeIcon, EyeIcon, EyeSlashIcon, PlayCircleIcon, QrCodeIcon, Squares2X2Icon, UserGroupIcon } from "@heroicons/react/24/outline";
import { updateEventStatusAction, updateProjectStatusAction, updateResultsAction, updateVotingAction } from "@/app/actions/admin";
import { logoutAction } from "@/app/actions/auth";
import { StatusBadge } from "@/components/status-badge";
import { getActiveEvent, getAdminOverview, getEventSettings, requireAdmin } from "@/lib/dal";
import type { EventStatus } from "@/lib/types";

export const metadata = { title: "Panel Admin" };
export const dynamic = "force-dynamic";

const lifecycleNext: Record<EventStatus, EventStatus[]> = {
  draft: ["registration"],
  registration: ["review"],
  review: ["showcase"],
  showcase: ["voting"],
  voting: ["closed"],
  closed: ["voting", "published"],
  published: ["archived"],
  archived: [],
};

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const event = await getActiveEvent();
  const [admin, overview, settings, query] = await Promise.all([requireAdmin(), getAdminOverview(event), getEventSettings(event), searchParams]);
  const nextStatuses = lifecycleNext[event.status];
  const message = typeof query.success === "string" ? query.success : typeof query.error === "string" ? query.error : null;
  const messageType = typeof query.error === "string" ? "error" : "success";
  return (
    <section className="admin-page section-shell">
      <div className="dashboard-heading"><div><span className="eyebrow">{event.displayName} · EVENT CONTROL CENTER</span><h1>Panel {event.displayName}.</h1><p>Kontrol katalog, voting, dan pengumuman dari satu tempat.</p></div><div className="profile-chip"><span>{admin.fullName.charAt(0)}</span><div><strong>{admin.fullName}</strong><small>Administrator</small></div><form action={logoutAction}><button className="chip-logout" type="submit" aria-label="Keluar" title="Keluar"><ArrowRightStartOnRectangleIcon /></button></form></div></div>
      {message && <div className={`form-alert form-alert-${messageType}`}>{message}</div>}
      <div className="stats-grid">
        <div className="stat-card"><Squares2X2Icon /><span>Total proyek</span><strong>{overview.projectCount}</strong><small>{overview.approvedCount} sudah tayang</small></div>
        <div className="stat-card"><UserGroupIcon /><span>Peserta terdaftar</span><strong>{overview.participantCount}</strong><small>Akun tim</small></div>
        <div className="stat-card"><ChartBarIcon /><span>Suara masuk</span><strong>{overview.voteCount}</strong><small>Identitas unik</small></div>
        <div className={`stat-card ${settings.votingOpen ? "stat-live" : ""}`}><span className="stat-live-dot" /><span>Status voting</span><strong>{settings.votingOpen ? "LIVE" : "OFF"}</strong><small>{settings.eventStatus}</small></div>
      </div>

      <div className="admin-controls">
        <div className="dashboard-card control-card"><div><span className="kicker">EVENT LIFECYCLE</span><h2>Fase: {settings.eventStatus}</h2><p>Perpindahan fase dijaga agar review, voting, dan hasil tidak tertukar.</p></div>{nextStatuses.length ? <form action={updateEventStatusAction} className="control-actions"><label className="sr-only" htmlFor="event-status">Fase event berikutnya</label><select id="event-status" name="status" defaultValue={nextStatuses[0]}>{nextStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select><button className="button button-primary" type="submit">Ubah fase</button></form> : <p className="form-alert form-alert-success">Edisi ini sudah diarsipkan.</p>}</div>
        <div className="dashboard-card control-card"><div><span className="kicker">VOTING CONTROL</span><h2>{settings.votingOpen ? "Voting sedang dibuka" : "Voting sedang ditutup"}</h2><p>{settings.votingOpen ? "Suara baru diterima secara realtime." : "Buka ketika pengunjung sudah siap memilih."}</p></div><form action={updateVotingAction}><input type="hidden" name="open" value={settings.votingOpen ? "0" : "1"} /><button className={`button ${settings.votingOpen ? "button-danger" : "button-primary"}`} type="submit">{settings.votingOpen ? <EyeSlashIcon /> : <EyeIcon />}{settings.votingOpen ? "Tutup voting" : "Buka voting"}</button></form></div>
        <div className="dashboard-card control-card"><div><span className="kicker">WINNER REVEAL</span><h2>Pengumuman juara</h2><p>Jalankan presentasi fullscreen, lalu publikasikan hasil.</p></div><div className="control-actions"><Link className="button button-primary" href="/admin/reveal"><PlayCircleIcon />Mulai reveal</Link><form action={updateResultsAction}><input type="hidden" name="publish" value={settings.resultsPublished ? "0" : "1"} /><button className="button button-ghost" type="submit">{settings.resultsPublished ? "Sembunyikan hasil" : "Publikasikan hasil"}</button></form></div></div>
        <Link className="dashboard-card qr-shortcut" href="/admin/qr"><QrCodeIcon /><div><span className="kicker">PRINT CENTER</span><h2>QR katalog & voting</h2><p>Siap cetak untuk pintu auditorium.</p></div></Link>
        <Link className="dashboard-card qr-shortcut" href="/admin/events"><ArchiveBoxIcon /><div><span className="kicker">EVENT OPERATIONS</span><h2>Kelola edisi</h2><p>Buat dan aktifkan edisi tahunan berikutnya.</p></div></Link>
      </div>

      <div className="admin-table-card">
        <div className="table-heading"><div><span className="kicker">PROJECT REVIEW</span><h2>Submission proyek</h2></div><span>{overview.projects.length} submission</span></div>
        {overview.projects.length ? <div className="admin-project-list">{overview.projects.map((project) => (
          <article className="admin-project-row" key={project.id}>
            <div className="admin-project-main">
              <span className="booth-mini">{project.boothLabel ?? project.boothNumber?.toString().padStart(2, "0") ?? "—"}</span>
              <div className="admin-project-info">
                <div className="admin-project-title"><strong>{project.title}</strong><StatusBadge status={project.status} /></div>
                <small>{project.teamName} · {project.className}</small>
                <div className="admin-project-votes"><ChartBarIcon /><strong>{project.voteCount}</strong><span>suara masuk</span></div>
              </div>
            </div>
            <form action={updateProjectStatusAction} className="review-form">
              <input type="hidden" name="projectId" value={project.id} />
              <label className="review-field"><span>Kode booth</span><input aria-label="Kode booth" name="boothLabel" type="text" maxLength={30} defaultValue={project.boothLabel ?? project.boothNumber ?? ""} placeholder="A-01" /></label>
              <label className="review-field"><span>Keputusan</span><select name="status" defaultValue={project.status === "draft" ? "submitted" : project.status}><option value="submitted">Menunggu review</option><option value="changes_requested">Minta revisi</option><option value="approved">Setujui proyek</option><option value="rejected">Tolak proyek</option></select></label>
              <button className="button button-primary button-compact review-submit" type="submit"><CheckBadgeIcon />Simpan review</button>
            </form>
          </article>
        ))}</div> : <div className="empty-state compact"><Squares2X2Icon /><h3>Belum ada submission</h3><p>Proyek peserta akan muncul di sini.</p></div>}
      </div>
    </section>
  );
}
