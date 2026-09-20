import type { MetadataRoute } from "next";
import { getPublishedEvents, getPublicProjects } from "@/lib/dal";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const events = await getPublishedEvents();
  const routes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/editions`, changeFrequency: "weekly", priority: 0.7 },
  ];
  for (const event of events) {
    const eventBase = `${base}/editions/${event.slug}`;
    routes.push(
      { url: `${eventBase}/catalog`, changeFrequency: event.status === "voting" ? "hourly" : "weekly", priority: event.isActive ? 0.9 : 0.6 },
      { url: `${eventBase}/results`, changeFrequency: "monthly", priority: 0.5 },
    );
    const projects = await getPublicProjects(event);
    routes.push(...projects.map((project) => ({ url: `${eventBase}/projects/${project.slug}`, changeFrequency: "monthly" as const, priority: 0.5 })));
  }
  return routes;
}
