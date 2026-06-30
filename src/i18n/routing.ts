import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Português como idioma principal; inglês (EUA) e espanhol.
  locales: ["pt", "en", "es"],
  defaultLocale: "pt",
  // PT fica na raiz (andreaeboli.com/...), EN em /en/... — melhor para SEO.
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
