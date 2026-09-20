import { ArrowRightStartOnRectangleIcon, ClipboardDocumentIcon, CloudArrowUpIcon, PlusIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { redirect } from "next/navigation";
import { createTeamAction, joinTeamAction, saveProjectAction } from "@/app/actions/team";
import { logoutAction } from "@/app/actions/auth";
import { CopyCodeButton } from "@/components/copy-code-button";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { getActiveEvent, getDashboardTeam, requireUser } from "@/lib/dal";

export const metadata = { title: "Dashboard Tim" };
export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const profile = await requireUser();
  if (profile.isAdmin) redirect("/admin");
  const event = await getActiveEvent();
  const [team, query] = await Promise.all([getDashboardTeam(profile.id, event), searchParams]);
  const message = typeof query.success === "string" ? query.success : typeof query.error === "string" ? query.error : null;
  const messageType = typeof query.error === "string" ? "error" : "success";

  return (
    <section className="dashboard-page section-shell">
      <div className="dashboard-heading"><div><span className="eyebrow">{event.displayName} · PARTICIPANT DASHBOARD</span><h1>Halo, {profile.fullName.split(" ")[0]}.</h1><p>Kelola tim dan submission proyek untuk edisi aktif.</p></div><div className="profile-chip"><span>{profile.fullName.charAt(0)}</span><div><strong>{profile.fullName}</strong><small>{profile.className}</small></div><form action={logoutAction}><button className="chip-logout" type="submit" aria-label="Keluar" title="Keluar"><ArrowRightStartOnRectangleIcon /></button></form></div></div>
      {message && <div className={`form-alert form-alert-${messageType}`}>{message}</div>}

      {!team ? (
        <div className="team-onboarding">
          <div className="dashboard-card">
            <div className="card-icon"><PlusIcon /></div><h2>Buat tim baru</h2><p>Kamu otomatis menjadi ketua dan mendapatkan kode undangan.</p>
            <form action={createTeamAction} className="stack-form">
              <label className="field"><span>Nama tim</span><input name="name" required minLength={2} maxLength={80} placeholder="Contoh: Syntax Squad" /></label>
              <label className="field"><span>Kelas</span><input name="className" required defaultValue={profile.className} /></label>
              <label className="field"><span>Kode enrollment edisi</span><input name="enrollmentCode" autoComplete="one-time-code" placeholder="Wajib untuk akun lintas edisi" /><small>Lewati jika akun ini baru saja mendaftar pada edisi aktif.</small></label>
              <SubmitButton>Buat tim</SubmitButton>
            </form>
          </div>
          <div className="dashboard-card">
            <div className="card-icon"><UserGroupIcon /></div><h2>Gabung tim</h2><p>Minta kode undangan 8 karakter dari ketua tim.</p>
            <form action={joinTeamAction} className="stack-form">
              <label className="field"><span>Kode tim</span><input className="code-input" name="joinCode" required minLength={8} maxLength={8} placeholder="A1B2C3D4" /></label>
              <label className="field"><span>Kode enrollment edisi</span><input name="enrollmentCode" autoComplete="one-time-code" placeholder="Wajib untuk akun lintas edisi" /><small>Lewati jika akun ini baru saja mendaftar pada edisi aktif.</small></label>
              <SubmitButton className="button button-ghost">Gabung tim</SubmitButton>
            </form>
          </div>
        </div>
      ) : (
        <div className="dashboard-grid">
          <aside className="dashboard-sidebar">
            <div className="dashboard-card team-card">
              <div className="team-card-head"><div className="card-icon"><UserGroupIcon /></div><StatusBadge status={team.project?.status ?? "draft"} /></div>
              <span className="kicker">TIM KAMU</span><h2>{team.name}</h2><p>{team.className}</p>
              <div className="join-code"><span>Kode undangan</span><div className="join-code-row"><strong>{team.joinCode}</strong><CopyCodeButton value={team.joinCode} /></div><small><ClipboardDocumentIcon />Bagikan ke anggota tim</small></div>
              <div className="member-list"><span>Anggota · {team.members.length}</span>{team.members.map((member) => <div key={member.id}><span>{member.fullName.charAt(0)}</span><p><strong>{member.fullName}</strong><small>{member.className}</small></p>{member.id === team.leaderId && <em>Ketua</em>}</div>)}</div>
            </div>
          </aside>
          <div className="dashboard-card project-form-card">
            <div className="project-form-heading"><div><span className="kicker">PROJECT SUBMISSION</span><h2>{team.project ? "Edit proyek" : "Masukkan proyek"}</h2><p>{team.isLeader ? "Setelah dikirim, panitia akan mereview sebelum proyek tayang." : "Hanya ketua tim yang dapat mengubah submission."}</p></div><CloudArrowUpIcon /></div>
            {team.isLeader ? (
              <form action={saveProjectAction} className="project-form">
                <div className="form-row">
                  <label className="field"><span>Nama proyek</span><input name="title" required maxLength={100} defaultValue={team.project?.title ?? ""} placeholder="Nama aplikasi" /></label>
                  <label className="field"><span>Kategori</span><select name="category" defaultValue={team.project?.category ?? "Web Application"}><option>Web Application</option><option>Mobile Application</option><option>Game</option><option>AI & Data</option><option>IoT</option><option>Creative Technology</option></select></label>
                </div>
                <label className="field"><span>Tagline singkat</span><input name="tagline" required maxLength={160} defaultValue={team.project?.tagline ?? ""} placeholder="Jelaskan value proyek dalam satu kalimat" /></label>
                <label className="field"><span>Deskripsi proyek</span><textarea name="description" required minLength={20} maxLength={3000} rows={7} defaultValue={team.project?.description ?? ""} placeholder="Masalah yang diselesaikan, fitur utama, dan teknologi yang digunakan." /></label>
                <div className="form-row">
                  <label className="field"><span>Link demo</span><input name="demoUrl" type="url" defaultValue={team.project?.demoUrl ?? ""} placeholder="https://" /></label>
                  <label className="field"><span>Repository</span><input name="repoUrl" type="url" defaultValue={team.project?.repoUrl ?? ""} placeholder="https://github.com/..." /></label>
                </div>
                <label className="field file-field"><span>Cover proyek</span><input name="cover" type="file" accept="image/jpeg,image/png,image/webp" /><small>JPG, PNG, atau WebP. Maksimal 3 MB.</small></label>
                <SubmitButton>{team.project ? "Simpan dan kirim ulang" : "Kirim proyek"}</SubmitButton>
              </form>
            ) : <div className="empty-state compact"><UserGroupIcon /><h3>Menunggu ketua tim</h3><p>Submission akan terlihat di sini setelah ketua mengisinya.</p></div>}
          </div>
        </div>
      )}
    </section>
  );
}
