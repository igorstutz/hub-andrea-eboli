import type { Metadata } from "next";
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

// Idioma no formato que o Open Graph espera (og:locale).
const OG_LOCALE: Record<string, string> = {
  pt: "pt_BR",
  en: "en_US",
  es: "es_ES",
};

export function ogLocaleFor(locale: string): string {
  return OG_LOCALE[locale] ?? OG_LOCALE[routing.defaultLocale];
}

// Código de idioma para o `inLanguage` do Schema.org.
export function languageTagFor(locale: string): string {
  return HREFLANG[locale] ?? locale;
}

// Cartão de compartilhamento (1200x630), gerado por `gera-og-image.mjs`.
// Caminho relativo de propósito: o metadataBase resolve e o basePath vem junto.
export const OG_IMAGE_PATH = "/brand/og-andrea-eboli.jpg";

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
// ⚠️ O canonical é o da PRÓPRIA página, não o do português: apontar as versões
// en/es para o pt dizia ao Google que elas são duplicatas, e tirava dois terços
// do site trilíngue do índice.
export function alternatesFor(path: string, locale: string) {
  return {
    canonical: localizedUrl(locale, path),
    languages: {
      ...languageAlternates(path),
      // Para quem não casa com nenhum idioma declarado.
      "x-default": localizedUrl(routing.defaultLocale, path),
    },
  };
}

// Metadata completa de uma página: título, descrição, canonical/hreflang e o
// cartão de compartilhamento.
// ⚠️ O cartão é montado inteiro aqui de propósito: o merge de metadata do Next
// é RASO, então uma página que declara `openGraph` substitui o do layout. Sem
// isso, ou a página perde a imagem de compartilhamento, ou todo link do site
// sai com o título genérico da home.
export function pageMetadata({
  title,
  description,
  path,
  locale,
}: {
  title: string;
  description?: string;
  path: string;
  locale: string;
}): Metadata {
  const images = [{ url: OG_IMAGE_PATH, width: 1200, height: 630 }];
  // O cartão tem de se explicar fora do site: um "Artigos" ou "About" solto não
  // diz de quem é. O <title> ganha o sufixo pelo template do layout; aqui o
  // mesmo, sem repetir quando o título já traz o nome dela.
  const socialTitle = title.includes("Andrea") ? title : `${title} · Andrea Eboli`;
  return {
    title,
    description,
    alternates: alternatesFor(path, locale),
    openGraph: {
      type: "website",
      siteName: "Andrea Eboli",
      locale: ogLocaleFor(locale),
      url: localizedUrl(locale, path),
      title: socialTitle,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images,
    },
  };
}
