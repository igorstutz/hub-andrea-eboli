import { routing } from "@/i18n/routing";

export const SITE_URL = "https://andreaeboli.com";

// Mapeia o locale interno para o código hreflang correto.
const HREFLANG: Record<string, string> = {
  pt: "pt-BR",
  en: "en",
  es: "es",
};

// URL absoluta de um caminho num dado idioma (PT na raiz, demais com prefixo).
export function localizedUrl(locale: string, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const suffix = clean === "/" ? "" : clean;
  return locale === routing.defaultLocale
    ? `${SITE_URL}${suffix}`
    : `${SITE_URL}/${locale}${suffix}`;
}

// Objeto de idiomas (hreflang) derivado dos locales configurados.
export function languageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[HREFLANG[loc] ?? loc] = localizedUrl(loc, path);
  }
  return languages;
}

// Alternates (canonical + hreflang) para o generateMetadata.
export function alternatesFor(path: string) {
  return {
    canonical: localizedUrl(routing.defaultLocale, path),
    languages: languageAlternates(path),
  };
}
