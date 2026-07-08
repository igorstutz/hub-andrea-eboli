import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Necessário para o export estático (GitHub Pages).
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/studio"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
