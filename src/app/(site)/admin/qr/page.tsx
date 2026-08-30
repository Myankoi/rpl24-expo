import { QrPrintCards } from "@/components/qr-print-cards";
import { requireAdmin } from "@/lib/dal";

export const metadata = { title: "QR Print Center" };

export default async function QrPage() {
  await requireAdmin();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return <section className="qr-page section-shell"><div className="page-heading"><span className="eyebrow">PRINT CENTER</span><h1>QR katalog & voting.</h1><p>Cetak ukuran A3 dan tempatkan pada pintu auditorium serta titik akhir pameran.</p></div><QrPrintCards catalogUrl={`${siteUrl}/catalog`} voteUrl={`${siteUrl}/vote`} /></section>;
}

