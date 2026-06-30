import { useTranslations } from "next-intl";

export default function ComingSoon({ title }: { title: string }) {
  const t = useTranslations("comingSoon");

  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-4xl px-6 py-28 text-center">
        <p className="font-sans uppercase tracking-[0.2em] text-xs text-wine mb-5">
          {t("title")}
        </p>
        <h1 className="text-5xl text-green-deep mb-5">{title}</h1>
        <p className="mx-auto max-w-md text-ink-soft">{t("body")}</p>
      </div>
    </section>
  );
}
