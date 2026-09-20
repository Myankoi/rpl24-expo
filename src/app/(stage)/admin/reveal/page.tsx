import { WinnerReveal } from "@/components/winner-reveal";
import { getActiveEvent, getPublishedRanking, requireAdmin } from "@/lib/dal";

export const metadata = { title: "Winner Reveal" };
export const dynamic = "force-dynamic";

export default async function RevealPage() {
  await requireAdmin();
  const event = await getActiveEvent();
  if (!["closed", "published"].includes(event.status)) return <section className="locked-results section-shell"><h1>Reveal belum tersedia.</h1><p>Tutup voting sebelum menjalankan pengumuman juara.</p></section>;
  const ranking = await getPublishedRanking(event);
  return <WinnerReveal ranking={ranking} eventName={event.displayName} />;
}
