import Link from "next/link";
import { ArrowRightStartOnRectangleIcon, ChartBarIcon, CheckBadgeIcon, EyeIcon, EyeSlashIcon, PlayCircleIcon, QrCodeIcon, Squares2X2Icon, UserGroupIcon } from "@heroicons/react/24/outline";
import { updateProjectStatusAction, updateResultsAction, updateVotingAction } from "@/app/actions/admin";
import { logoutAction } from "@/app/actions/auth";
import { StatusBadge } from "@/components/status-badge";
import { getAdminOverview, getEventSettings, requireAdmin } from "@/lib/dal";

export const metadata = { title: "Panel Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const [admin, overview, settings, query] = await Promise.all([requireAdmin(), getAdminOverview(), getEventSettings(), searchParams]);
  const message = typeof query.success === "string" ? query.success : typeof query.error === "string" ? query.error : null;
  const messageType = typeof query.error === "string" ? "error" : "success";
  return (
    <section className="admin-page section-shell">
      <div className="dashboard-heading"><div><span className="eyebrow">EVENT CONTROL CENTER</span><h1>Panel RPL Expo.</h1><p>Kontrol katalog, voting, dan pengumuman dari satu tempat.</p></div><div className="profile-chip"><span>{admin.fullName.charAt(0)}</span><div><strong>{admin.fullName}</strong><small>Administrator</small></div><form action={logoutAction}><button className="chip-logout" type="submit" aria-label="Keluar" title="Keluar"><ArrowRightStartOnRectangleIcon /></button></form></div></div>
      {message && <div className={`form-alert form-alert-${messageType}`}>{message}</div>}
      <div className="stats-grid">
        <div className="stat-card"><Squares2X2Icon /><span>Total proyek</span><strong>{overview.projectCount}</strong><small>{overview.approvedCount} sudah tayang</small></div>
        <div className="stat-card"><UserGroupIcon /><span>Peserta terdaftar</span><strong>{overview.participantCount}</strong><small>Akun tim</small></div>
        <div className="stat-card"><ChartBarIcon /><span>Suara masuk</span><strong>{overview.voteCount}</strong><small>Identitas unik</small></div>
        <div className={`stat-card ${settings.votingOpen ? "stat-live" : ""}`}><span className="stat-live-dot" /><span>Status voting</span><strong>{settings.votingOpen ? "LIVE" : "OFF"}</strong><small>{settings.eventStatus}</small></div>
      </div>

      <div className="admin-controls">
        <div className="dashboard-card control-card"><div><span className="kicker">VOTING CONTROL</span><h2>{settings.votingOpen ? "Voting sedang dibuka" : "Voting sedang ditutup"}</h2><p>{settings.votingOpen ? "Suara baru diterima secara realtime." : "Buka ketika pengunjung sudah siap memilih."}</p></div><form action={updateVotingAction}><input type="hidden" name="open" value={settings.votingOpen ? "0" : "1"} /><button className={`button ${settings.votingOpen ? "button-danger" : "button-primary"}`} type="submit">{settings.votingOpen ? <EyeSlashIcon /> : <EyeIcon />}{settings.votingOpen ? "Tutup voting" : "Buka voting"}</button></form></div>
        <div className="dashboard-card control-card"><div><span className="kicker">WINNER REVEAL</span><h2>Pengumuman juara</h2><p>Jalankan presentasi fullscreen, lalu publikasikan hasil.</p></div><div className="control-actions"><Link className="button button-primary" href="/admin/reveal"><PlayCircleIcon />Mulai reveal</Link><form action={updateResultsAction}><input type="hidden" name="publish" value={settings.resultsPublished ? "0" : "1"} /><button className="button button-ghost" type="submit">{settings.resultsPublished ? "Sembunyikan hasil" : "Publikasikan hasil"}</button></form></div></div>
        <Link className="dashboard-card qr-shortcut" href="/admin/qr"><QrCodeIcon /><div><span className="kicker">PRINT CENTER</span><h2>QR katalog & voting</h2><p>Siap cetak untuk pintu auditorium.</p></div></Link>
      </div>

      <div className="admin-table-card">
        <div className="table-heading"><div><span className="kicker">PROJECT REVIEW</span><h2>Submission proyek</h2></div><span>{overview.projects.length} submission</span></div>
        {overview.projects.length ? <div className="admin-project-list">{overview.projects.map((project) => (
          <article className="admin-project-row" key={project.id}>
            <div className="admin-project-main">
              <span className="booth-mini">{project.boothNumber?.toString().padStart(2, "0") ?? "—"}</span>
              <div className="admin-project-info">
                <div className="admin-project-title"><strong>{project.title}</strong><StatusBadge status={project.status} /></div>
                <small>{project.teamName} · {project.className}</small>
                <div className="admin-project-votes"><ChartBarIcon /><strong>{project.voteCount}</strong><span>suara masuk</span></div>
              </div>
            </div>
            <form action={updateProjectStatusAction} className="review-form">
              <input type="hidden" name="projectId" value={project.id} />
              <label className="review-field"><span>Nomor booth</span><input aria-label="Nomor booth" name="boothNumber" type="number" min={1} max={14} defaultValue={project.boothNumber ?? ""} placeholder="1–14" /></label>
              <label className="review-field"><span>Keputusan</span><select name="status" defaultValue={project.status === "draft" ? "submitted" : project.status}><option value="submitted">Menunggu review</option><option value="approved">Setujui proyek</option><option value="rejected">Minta revisi</option></select></label>
              <button className="button button-primary button-compact review-submit" type="submit"><CheckBadgeIcon />Simpan review</button>
            </form>
          </article>
        ))}</div> : <div className="empty-state compact"><Squares2X2Icon /><h3>Belum ada submission</h3><p>Proyek peserta akan muncul di sini.</p></div>}
      </div>
    </section>
  );
}
