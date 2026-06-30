import { getTranslations } from "next-intl/server";

export default async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="bg-green-darker text-cream/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-serif italic text-xl text-cream">Andrea Eboli</p>
          <p className="mt-1 max-w-sm text-sm">{t("tagline")}</p>
        </div>
        <p className="text-xs text-cream/50">
          © Andrea Eboli. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
