import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const INSTAGRAM = "https://www.instagram.com/souandreaeboli";

const COL_A = [
  { key: "serPoder", href: "/ser-poder" },
  { key: "about", href: "/sobre" },
  { key: "articlesQuestions", href: "/artigos-e-perguntas" },
  { key: "videosPodcast", href: "/videos" },
] as const;

const COL_B = [
  { key: "media", href: "/na-midia" },
  { key: "book", href: "/livro" },
  { key: "contact", href: "/contato" },
  { key: "search", href: "/busca" },
] as const;

export default async function Footer() {
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");
  const tb = await getTranslations("banner");

  return (
    <footer className="bg-green-darker text-cream/70">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <Link href="/" className="wordmark text-2xl text-cream">
            Andrea Eboli
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-relaxed">{t("tagline")}</p>
          <a
            href={INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-sm text-cream/80 transition-colors hover:text-cream"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cream/60" />
            @souandreaeboli
          </a>
        </div>

        <nav className="flex flex-col gap-3 text-sm">
          {COL_A.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className="w-fit text-cream/70 transition-colors hover:text-cream"
            >
              {tn(key)}
            </Link>
          ))}
        </nav>

        <nav className="flex flex-col gap-3 text-sm">
          {COL_B.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className="w-fit text-cream/70 transition-colors hover:text-cream"
            >
              {tn(key)}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="kicker text-cream/40">{tb("kicker")}</p>
          <p className="text-xs text-cream/50">
            © Andrea Eboli. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
