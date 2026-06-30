import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { sanityFetch } from "@/sanity/lib/fetch";
import { sitemapQuery } from "@/sanity/lib/queries";
import { localizedUrl, languageAlternates } from "@/lib/seo";

const TYPE_TO_PATH: Record<string, string> = {
  question: "/perguntas",
  concept: "/conceitos",
  caseStudy: "/casos",
  article: "/pesquisas",
  video: "/videos",
};

const STATIC_PATHS = [
  "/",
  "/perguntas",
  "/conceitos",
  "/casos",
  "/pesquisas",
  "/videos",
  "/sobre",
];

type Doc = { _type: string; slug: string; _updatedAt: string };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let docs: Doc[] = [];
  try {
    docs = await sanityFetch<Doc[]>(sitemapQuery);
  } catch {
    docs = [];
  }

  const entries: MetadataRoute.Sitemap = [];

  // Páginas fixas, em todos os idiomas configurados
  for (const path of STATIC_PATHS) {
    entries.push({
      url: localizedUrl(routing.defaultLocale, path),
      alternates: { languages: languageAlternates(path) },
    });
  }

  // Documentos do Sanity, em todos os idiomas
  for (const doc of docs) {
    const base = TYPE_TO_PATH[doc._type];
    if (!base) continue;
    const path = `${base}/${doc.slug}`;
    entries.push({
      url: localizedUrl(routing.defaultLocale, path),
      lastModified: doc._updatedAt,
      alternates: { languages: languageAlternates(path) },
    });
  }

  return entries;
}
