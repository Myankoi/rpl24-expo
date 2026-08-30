import { WinnerReveal } from "@/components/winner-reveal";
import { getRanking, requireAdmin } from "@/lib/dal";

export const metadata = { title: "Winner Reveal" };
export const dynamic = "force-dynamic";

export default async function RevealPage() {
  await requireAdmin();
  const ranking = await getRanking();
  return <WinnerReveal ranking={ranking} />;
}

