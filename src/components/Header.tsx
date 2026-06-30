import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

const NAV = [
  { key: "questions", href: "/perguntas" },
  { key: "concepts", href: "/conceitos" },
  { key: "cases", href: "/casos" },
  { key: "research", href: "/pesquisas" },
  { key: "videos", href: "/videos" },
  { key: "about", href: "/sobre" },
] as const;

export default async function Header() {
  const t = await getTranslations("nav");

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-[var(--header-h)] max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-green-deep font-serif italic text-sm text-green-deep">
            AE
          </span>
          <span className="font-serif italic text-xl text-green-deep">
            Andrea Eboli
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className="text-sm text-ink-soft transition-colors hover:text-wine"
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href="/busca"
            aria-label={t("search")}
            className="text-ink-soft transition-colors hover:text-wine"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3-3" />
            </svg>
          </Link>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
