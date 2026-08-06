// Extração de texto de páginas de artigo (Forbes, LinkedIn) para a ingestão.
//
// Por que "na mão" e não uma lib: o hub roda sem dependências extras e o que
// precisamos é modesto — metadados (og:*) + o texto corrido do artigo. Forbes e
// LinkedIn frequentemente barram robôs (403) ou devolvem muro de login, então a
// ferramenta do Studio SEMPRE permite colar/corrigir o texto à mão. Aqui a gente
// tenta o caminho automático e informa com honestidade o que aconteceu.

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

const MAX_TEXT = 60_000; // caracteres — o suficiente para qualquer artigo
const MIN_USABLE = 400; // abaixo disso não dá para gerar conteúdo decente

export type WebArticleStatus = "ok" | "empty" | "blocked";

export type WebArticle = {
  url: string;
  title?: string;
  author?: string;
  description?: string;
  publishDate?: string;
  text: string;
  status: WebArticleStatus;
  httpStatus?: number;
};

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  eacute: "é",
  aacute: "á",
  atilde: "ã",
  ccedil: "ç",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (m, name: string) => ENTITIES[name.toLowerCase()] ?? m);
}

function meta(html: string, ...keys: string[]): string | undefined {
  for (const key of keys) {
    // aceita property=/name= em qualquer ordem em relação a content=
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`,
        "i",
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`,
        "i",
      ),
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]?.trim()) return decodeEntities(m[1].trim());
    }
  }
  return undefined;
}

/** Converte o HTML do corpo em texto com markdown leve (## e listas). */
function htmlToText(html: string): string {
  let s = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|template|svg|form|iframe)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(nav|header|footer|aside)[\s\S]*?<\/\1>/gi, " ");

  // Preferir o maior bloco <article> (ou main), quando existir.
  const blocks = [...s.matchAll(/<(article|main)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(
    (m) => m[2],
  );
  if (blocks.length) {
    s = blocks.reduce((a, b) => (b.length > a.length ? b : a), "");
  }

  s = s
    .replace(/<h[1-6][^>]*>/gi, "\n\n## ")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|ul|ol|blockquote|tr)>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ");

  return decodeEntities(s)
    .replace(/[ \t ]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter((line, i, all) => line.length > 0 || all[i - 1]?.length > 0)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_TEXT);
}

function firstDate(html: string): string | undefined {
  const fromMeta = meta(
    html,
    "article:published_time",
    "og:article:published_time",
    "datePublished",
    "publish-date",
  );
  if (fromMeta) return fromMeta;
  const t = html.match(/<time[^>]+datetime=["']([^"']+)["']/i);
  return t?.[1];
}

export async function fetchWebArticle(url: string): Promise<WebArticle> {
  let res: Response;
  try {
    res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(25_000),
      headers: {
        "user-agent": UA,
        accept: "text/html,application/xhtml+xml",
        "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });
  } catch {
    return { url, text: "", status: "blocked" };
  }

  if (!res.ok) {
    return { url, text: "", status: "blocked", httpStatus: res.status };
  }

  const html = await res.text();
  const rawTitle = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const title =
    meta(html, "og:title", "twitter:title") ??
    (rawTitle ? decodeEntities(rawTitle) : undefined);
  const text = htmlToText(html);

  return {
    url: res.url || url,
    title,
    author: meta(html, "author", "article:author", "og:article:author"),
    description: meta(html, "og:description", "description", "twitter:description"),
    publishDate: firstDate(html),
    text,
    status: text.length >= MIN_USABLE ? "ok" : "empty",
    httpStatus: res.status,
  };
}

export const MIN_USABLE_TEXT = MIN_USABLE;
