import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getActiveEvent } from "@/lib/dal";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const event = await getActiveEvent();
  return <><Header event={event} /><main className="site-main">{children}</main><Footer event={event} /></>;
}
