import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Português como idioma principal; inglês (EUA) e espanhol.
  locales: ["pt", "en", "es"],
  defaultLocale: "pt",
  // Prefixo SEMPRE (/pt, /en, /es): necessário para o export estático
  // (GitHub Pages, sem middleware). A raiz "/" redireciona para /pt.
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
