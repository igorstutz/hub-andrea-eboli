import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import PageBanner from "@/components/PageBanner";
import Reveal from "@/components/Reveal";
import NewsletterForm from "@/components/NewsletterForm";
import { pageMetadata } from "@/lib/seo";
import { getPageText, getNewsletterLabels } from "@/lib/pageText";
import { sanityFetch } from "@/sanity/lib/fetch";
import { pageImageQuery } from "@/sanity/lib/queries";
import { urlFor, type ImageSource } from "@/sanity/lib/image";
import Image from "next/image";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const { tx: tp } = await getPageText("bookPage", "bookPage", locale);
  return pageMetadata({
    title: t("book"),
    description: tp("headline"),
    path: "/livro",
    locale,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [{ tx: t }, newsletter, cover] = await Promise.all([
    getPageText("bookPage", "bookPage", locale),
    getNewsletterLabels(locale),
    sanityFetch<{ image: ImageSource | null; lqip?: string } | null>(pageImageQuery, {
      id: "bookPage",
      field: "cover",
    }),
  ]);
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
          {/* Capa: a do painel (Livro → Capa do livro) ou a provisória desenhada */}
          <Reveal>
            <div className="relative mx-auto w-full max-w-[240px]">
              <div
                aria-hidden
                className="absolute -right-3 -top-3 h-full w-full rounded-r-lg bg-wine/40"
              />
              {cover?.image ? (
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-r-lg shadow-[0_40px_80px_-40px_rgba(20,49,44,0.6)]">
                  <Image
                    src={urlFor(cover.image).width(600).height(800).fit("crop").auto("format").url()}
                    alt={t("headline")}
                    fill
                    sizes="240px"
                    className="object-cover"
                  />
                </div>
              ) : (
              <div className="photo-duotone relative flex aspect-[3/4] w-full flex-col items-center justify-center gap-4 rounded-r-lg bg-green-deep px-6 text-center text-cream shadow-[0_40px_80px_-40px_rgba(20,49,44,0.6)]">
                <span className="wordmark text-6xl text-cream/25">AE</span>
                <span className="kicker text-cream/50">Ser Poder</span>
              </div>
              )}
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
                <NewsletterForm tone="light" labels={newsletter} />
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
