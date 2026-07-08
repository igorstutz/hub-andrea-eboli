import { routing } from "@/i18n/routing";

// URL pública do site. No deploy do GitHub Pages vem do ambiente
// (inclui o caminho do repositório, ex.: https://igorstutz.github.io/hub-andrea-eboli).
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://andreaeboli.com";

// Mapeia o locale interno para o código hreflang correto.
const HREFLANG: Record<string, string> = {
  pt: "pt-BR",
  en: "en",
  es: "es",
};

// URL absoluta de um caminho num dado idioma (prefixo sempre: /pt, /en, /es).
export function localizedUrl(locale: string, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const suffix = clean === "/" ? "" : clean;
  return `${SITE_URL}/${locale}${suffix}`;
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
