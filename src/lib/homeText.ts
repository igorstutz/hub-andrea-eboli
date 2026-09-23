// Os textos da página inicial vêm do painel, com a tradução como rede.
//
// 🔴 A REGRA: o que está preenchido no Sanity vence; o que está vazio cai no
// arquivo de tradução (`messages/<locale>.json`). Nunca o contrário, e nunca
// texto vazio na tela.
//
// Por que com fallback, e não migrando tudo de uma vez: um campo apagado sem
// querer no painel não pode abrir um buraco na home. E a tradução continua
// sendo a fonte de quem escreve código, o que mantém o site montável mesmo com
// o dataset fora do ar.
//
// 📌 O nome do campo no Sanity é IGUAL à chave de tradução (`thesisP1`, `q1`,
// `audienceDenial`…). É isso que permite esta ponte ser tão curta.

/** Um texto traduzível como o Sanity guarda: um valor por idioma. */
export type LocaleValue = { pt?: string; en?: string; es?: string } | null;

/** O documento `homePage` como a query o devolve: campos soltos e listas. */
export type HomeDoc = Record<string, LocaleValue | LocaleValue[] | undefined> | null;

type Translator = {
  (key: string): string;
  raw: (key: string) => unknown;
};

function pick(value: LocaleValue, locale: string): string {
  if (!value) return "";
  const v = value[locale as "pt" | "en" | "es"];
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Devolve as duas funções que a página usa no lugar de `t` e `t.raw`:
 *
 *   const { tx, txList } = homeText(doc, locale, t);
 *   tx("thesisP1")          → string
 *   txList("audienceDenial") → string[]
 */
export function homeText(doc: HomeDoc, locale: string, t: Translator) {
  const tx = (key: string): string => {
    const doSanity = pick(doc?.[key] as LocaleValue, locale);
    return doSanity || t(key);
  };

  const txList = (key: string): string[] => {
    const value = doc?.[key];
    if (Array.isArray(value)) {
      const itens = value
        .map((item) => pick(item, locale))
        .filter((s) => s.length > 0);
      // Lista vazia (ou só com itens em branco) não conta como resposta: cai
      // na tradução, senão a seção sumiria da página sem ninguém notar.
      if (itens.length > 0) return itens;
    }
    const bruto = t.raw(key);
    return Array.isArray(bruto) ? (bruto as string[]) : [];
  };

  return { tx, txList };
}
