import { QrPrintCards } from "@/components/qr-print-cards";
import { TicketBatchForm } from "@/components/ticket-batch-form";
import { getActiveEvent, requireAdmin } from "@/lib/dal";

export const metadata = { title: "QR Print Center" };

export default async function QrPage() {
  await requireAdmin();
  const event = await getActiveEvent();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const voteUrl = `${siteUrl}/editions/${event.slug}/vote`;
  return <section className="qr-page section-shell"><div className="page-heading"><span className="eyebrow">{event.displayName} · PRINT CENTER</span><h1>QR katalog & voting.</h1><p>Cetak ukuran A3 dan tempatkan pada pintu auditorium serta titik akhir pameran.</p></div><QrPrintCards eventName={event.displayName} catalogUrl={`${siteUrl}/editions/${event.slug}/catalog`} voteUrl={voteUrl} /><TicketBatchForm voteBaseUrl={voteUrl} /></section>;
}
