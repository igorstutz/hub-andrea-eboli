import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SideCard from "./SideCard";

// Mini-card da autora, usado na sidebar das páginas de detalhe.
export default async function AuthorCard() {
  const t = await getTranslations();

  return (
    <SideCard label={t("articlePage.writtenBy")} muted>
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-green-deep font-serif italic text-lg text-green-deep">
          AE
        </span>
        <div className="min-w-0">
          <p className="font-serif text-xl leading-tight text-green-deep">
            Andrea Eboli
          </p>
          <p className="text-xs text-muted">{t("home.badge")}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">
        {t("footer.tagline")}
      </p>
      <Link
        href="/sobre"
        className="mt-3 inline-block text-sm font-medium text-wine underline-offset-2 hover:underline"
      >
        {t("home.ctaSecondary")} →
      </Link>
    </SideCard>
  );
}
