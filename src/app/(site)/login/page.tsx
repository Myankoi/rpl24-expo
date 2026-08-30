import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { AuthForm } from "@/components/auth-form";
import { getCurrentProfile } from "@/lib/dal";

export const metadata = { title: "Login Peserta" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const profile = await getCurrentProfile();
  if (profile) redirect(profile.isAdmin ? "/admin" : "/dashboard");
  const { message } = await searchParams;
  return (
    <section className="auth-page section-shell">
      <div className="auth-copy">
        <span className="eyebrow">AREA PESERTA</span>
        <h1>Kelola tim dan tampilkan karya terbaikmu.</h1>
        <p>Login hanya diperlukan untuk peserta yang mengirim proyek. Pengunjung dapat melihat katalog dan voting tanpa akun.</p>
        <Link href="/catalog" className="text-link">Kembali ke katalog <ArrowRightIcon /></Link>
      </div>
      <div className="auth-card">
        <div><span className="kicker">Selamat datang</span><h2>Login peserta</h2><p>Masukkan akun yang digunakan saat mendaftar.</p></div>
        {message && <div className="form-alert form-alert-success">{message}</div>}
        <AuthForm mode="login" />
      </div>
    </section>
  );
}
