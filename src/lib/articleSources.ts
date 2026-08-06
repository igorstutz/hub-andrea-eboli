// Fontes de um artigo do hub — viram o filtro (tipo categoria) na biblioteca.
// Espelha as opções do campo `source` em src/sanity/schemaTypes/documents/article.ts.
// Rótulos ficam no i18n (`articleSources.*`), porque "Originais" muda de idioma.

export const ARTICLE_SOURCES = [
  "youtube",
  "forbes",
  "linkedin",
  "original",
] as const;

export type ArticleSource = (typeof ARTICLE_SOURCES)[number];

/** Artigo sem fonte (ou com valor desconhecido) conta como "original". */
export function normalizeArticleSource(value?: string | null): ArticleSource {
  return ARTICLE_SOURCES.includes(value as ArticleSource)
    ? (value as ArticleSource)
    : "original";
}

/**
 * Fontes realmente presentes na lista, na ordem canônica. Serve para não
 * mostrar um filtro "Forbes" quando não existe nenhum artigo da Forbes.
 */
export function presentArticleSources(
  items: Array<{ source?: string | null }>,
): ArticleSource[] {
  const found = new Set(items.map((i) => normalizeArticleSource(i.source)));
  return ARTICLE_SOURCES.filter((s) => found.has(s));
}
