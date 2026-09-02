import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { sanityFetch } from "@/sanity/lib/fetch";
import { sitemapQuery } from "@/sanity/lib/queries";
import { localizedUrl, languageAlternates } from "@/lib/seo";

// Necessário para o export estático (GitHub Pages).
export const dynamic = "force-static";

const TYPE_TO_PATH: Record<string, string> = {
  question: "/perguntas",
  concept: "/conceitos",
  caseStudy: "/casos",
  article: "/artigos",
  video: "/videos",
};

// "/na-midia" voltou ao sitemap em 31/08/2026, junto com o menu: a divulgação
// vai começar e a página precisa ser indexável.
const STATIC_PATHS = [
  "/",
  "/sobre",
  "/artigos-e-perguntas",
  "/videos",
  "/pesquisa",
  "/confraria",
  "/na-midia",
  "/livro",
  "/contato",
  "/perguntas",
  "/conceitos",
  "/casos",
  "/artigos",
];

type Doc = { _type: string; slug: string; _updatedAt: string };

/**
 * Barra final, para o sitemap casar com a URL que o servidor realmente serve.
 *
 * O export usa `trailingSlash: true`, então cada rota vive em
 * `pt/sobre/index.html` e o Next já escreve o canonical COM barra
 * (`.../pt/sobre/`). O `localizedUrl` devolve SEM barra, o que era invisível
 * no canonical (o Next normaliza) mas ficava cru no sitemap: as 50 entradas
 * apontavam para uma URL que responde 301 para a versão com barra. Sitemap
 * cheio de redirecionamento é desperdício de rastreio e divergência do
 * canonical.
 *
 * Não mexer no `localizedUrl` de propósito: ele alimenta o canonical e o
 * hreflang, que já saem corretos.
 */
const comBarra = (url: string): string => (url.endsWith("/") ? url : `${url}/`);

const alternatesComBarra = (path: string): Record<string, string> =>
  Object.fromEntries(
    Object.entries(languageAlternates(path)).map(([k, v]) => [k, comBarra(v)]),
  );

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
      url: comBarra(localizedUrl(routing.defaultLocale, path)),
      alternates: { languages: alternatesComBarra(path) },
    });
  }

  // Documentos do Sanity, em todos os idiomas
  for (const doc of docs) {
    const base = TYPE_TO_PATH[doc._type];
    if (!base) continue;
    const path = `${base}/${doc.slug}`;
    entries.push({
      url: comBarra(localizedUrl(routing.defaultLocale, path)),
      lastModified: doc._updatedAt,
      alternates: { languages: alternatesComBarra(path) },
    });
  }

  return entries;
}
