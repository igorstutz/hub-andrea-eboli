// Os textos das páginas fixas vêm do painel, com a tradução como rede.
//
// 🔴 A REGRA: o que está preenchido no Sanity vence; o que está vazio cai no
// arquivo de tradução (`messages/<locale>.json`). Nunca o contrário, e nunca
// texto vazio na tela.
//
// Por que com fallback: um campo apagado sem querer no painel não pode abrir
// um buraco na página. E a tradução continua sendo a fonte de quem escreve
// código, o que mantém o site montável mesmo com o dataset fora do ar.
//
// Nasceu como `homeText.ts` (22/09/2026, só a home) e virou genérico em 25/09,
// quando todas as páginas fixas foram para o painel. Os campos de cada página
// estão em `src/sanity/pageTextDefs.ts`.
//
// 📌 O nome do campo no Sanity é a chave de tradução (`thesisP1`, `q1`…), com a
// chave aninhada em camelCase (`questions.name` → `questionsName`). É isso que
// deixa esta ponte sem mapa de-para.

import { getTranslations } from "next-intl/server";
import { sanityFetch } from "@/sanity/lib/fetch";
import { pageTextQuery } from "@/sanity/lib/queries";
import { fieldNameFor } from "@/sanity/pageTextDefs";

/** Um texto traduzível como o Sanity guarda: um valor por idioma. */
export type LocaleValue = { pt?: string; en?: string; es?: string } | null;

/** O documento da página como a query o devolve: um saco de campos. */
export type PageDoc = Record<string, unknown> | null;

type Translator = {
  (key: string): string;
  raw: (key: string) => unknown;
};

function pick(value: unknown, locale: string): string {
  // Campo "igual nos 3 idiomas" (e-mail, nome de pessoa) é string pura.
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  const v = (value as Record<string, unknown>)[locale];
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Devolve as funções que a página usa no lugar de `t` e `t.raw`:
 *
 *   tx("thesisP1")            → string (o painel, ou a tradução)
 *   tx("title", tn("media"))  → com reserva explícita, para campo que não
 *                               existe no namespace
 *   txList("audienceDenial")  → string[]
 *   num("ideaControlPct", 54.8) → número do painel, ou o padrão
 *   url("researchUrl")        → endereço, ou null
 *
 * `prefix` serve ao bloco que mora no documento de outra página: a abertura
 * comum de Pesquisa e Confraria lê `evidence.*` da tradução e `evidenceLabel`…
 * do documento da Pesquisa.
 */
export function pageText(doc: PageDoc, locale: string, t: Translator, prefix?: string) {
  const get = (key: string) => doc?.[fieldNameFor(key, prefix)];

  const tx = (key: string, fallback?: string): string =>
    pick(get(key), locale) || (fallback ?? t(key));

  const txList = (key: string): string[] => {
    const value = get(key);
    if (Array.isArray(value)) {
      const itens = value.map((item) => pick(item, locale)).filter((s) => s.length > 0);
      // Lista vazia (ou só com itens em branco) não conta como resposta: cai
      // na tradução, senão a seção sumiria da página sem ninguém notar.
      if (itens.length > 0) return itens;
    }
    const bruto = t.raw(key);
    return Array.isArray(bruto) ? (bruto as string[]) : [];
  };

  const num = (key: string, fallback: number): number => {
    const v = get(key);
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
  };

  const url = (key: string): string | null => {
    const v = get(key);
    return typeof v === "string" && /^https?:\/\//.test(v.trim()) ? v.trim() : null;
  };

  return { doc, tx, txList, num, url };
}

/** Busca o documento da página e a tradução juntos. `type` é o tipo (e o _id)
 *  do singleton; `namespace`, o da tradução de reserva. */
export async function getPageText(
  type: string,
  namespace: string,
  locale: string,
  prefix?: string,
) {
  const [doc, t] = await Promise.all([
    sanityFetch<PageDoc>(pageTextQuery, { id: type }),
    getTranslations({ locale, namespace }),
  ]);
  return pageText(doc, locale, t as unknown as Translator, prefix);
}

/** Os rótulos do formulário de newsletter (componente de cliente), lidos do
 *  documento da home. Usado na home, no Livro e no Contato. */
export async function getNewsletterLabels(locale: string) {
  const { tx } = await getPageText("homePage", "home", locale);
  return {
    newsletterPlaceholder: tx("newsletterPlaceholder"),
    newsletterCta: tx("newsletterCta"),
    newsletterOk: tx("newsletterOk"),
    newsletterError: tx("newsletterError"),
  };
}
