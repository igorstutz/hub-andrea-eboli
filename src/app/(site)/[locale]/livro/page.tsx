import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import PageBanner from "@/components/PageBanner";
import Reveal from "@/components/Reveal";
import NewsletterForm from "@/components/NewsletterForm";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return {
    title: t("book"),
    alternates: alternatesFor("/livro"),
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("bookPage");
  const tc = await getTranslations("common");
  const tn = await getTranslations("nav");

  return (
    <>
      <PageBanner
        crumbs={[{ label: tc("home"), href: "/" }, { label: tn("book") }]}
        badge={t("badge")}
        title={tn("book")}
        lead={t("headline")}
      />

      <section className="bg-cream">
        <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 py-20 md:grid-cols-[280px_1fr] md:gap-16 md:py-24">
          {/* Capa (placeholder) */}
          <Reveal>
            <div className="relative mx-auto w-full max-w-[240px]">
              <div
                aria-hidden
                className="absolute -right-3 -top-3 h-full w-full rounded-r-lg bg-wine/40"
              />
              <div className="photo-duotone relative flex aspect-[3/4] w-full flex-col items-center justify-center gap-4 rounded-r-lg bg-green-deep px-6 text-center text-cream shadow-[0_40px_80px_-40px_rgba(20,49,44,0.6)]">
                <span className="wordmark text-6xl text-cream/25">AE</span>
                <span className="kicker text-cream/50">Ser Poder</span>
              </div>
            </div>
          </Reveal>

          {/* Texto + newsletter */}
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-wine/30 bg-wine/5 px-3.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-wine">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-wine" />
                {t("status")}
              </span>
            </Reveal>
            <Reveal delay={120}>
              <h2 className="mt-5 text-3xl text-green-deep md:text-4xl">
                {t("headline")}
              </h2>
            </Reveal>
            <Reveal delay={240}>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
                {t("body")}
              </p>
            </Reveal>
            <Reveal delay={360}>
              <div className="mt-8 max-w-md">
                <NewsletterForm tone="light" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
