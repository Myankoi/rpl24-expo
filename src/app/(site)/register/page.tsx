import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { AuthForm } from "@/components/auth-form";
import { getCurrentProfile } from "@/lib/dal";

export const metadata = { title: "Daftar Peserta" };

export default async function RegisterPage() {
  const profile = await getCurrentProfile();
  if (profile) redirect(profile.isAdmin ? "/admin" : "/dashboard");
  return (
    <section className="auth-page section-shell">
      <div className="auth-copy">
        <span className="eyebrow">SUBMIT YOUR PROJECT</span>
        <h1>Satu akun untuk satu anggota tim.</h1>
        <p>Gunakan kode enrollment dari panitia, lalu buat tim baru atau masukkan kode undangan dari ketua tim.</p>
        <Link href="/catalog" className="text-link">Lihat proyek yang sudah tayang <ArrowRightIcon /></Link>
      </div>
      <div className="auth-card">
        <div><span className="kicker">Akun baru</span><h2>Daftar peserta</h2><p>Email perlu diverifikasi sebelum login.</p></div>
        <AuthForm mode="register" />
      </div>
    </section>
  );
}
