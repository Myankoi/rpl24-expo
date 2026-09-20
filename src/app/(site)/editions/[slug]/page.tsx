import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/editions/${slug}/catalog`);
}
