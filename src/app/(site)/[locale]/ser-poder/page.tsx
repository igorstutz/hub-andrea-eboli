import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageBanner from "@/components/PageBanner";
import Reveal from "@/components/Reveal";
import { sanityFetch } from "@/sanity/lib/fetch";
import { conceptsListQuery } from "@/sanity/lib/queries";
import { alternatesFor } from "@/lib/seo";

type CItem = { title: string; slug: string; shortDefinition?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return {
    title: t("serPoder"),
    alternates: alternatesFor("/ser-poder"),
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("serPoderPage");
  const tc = await getTranslations("common");
  const tn = await getTranslations("nav");
  const tb = await getTranslations("banner");

  const concepts = await sanityFetch<CItem[]>(conceptsListQuery, { locale });

  return (
    <>
      <PageBanner
        crumbs={[{ label: tc("home"), href: "/" }, { label: tn("serPoder") }]}
        badge={t("badge")}
        kicker={tb("kicker")}
        title="Ser Poder"
        lead={t("headline")}
      />

      {/* Intro */}
      <section className="bg-cream">
        <div className="mx-auto max-w-3xl px-6 py-20 md:py-24">
          <Reveal>
            <h2 className="text-3xl text-green-deep md:text-4xl">
              {t("introTitle")}
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-6 text-lg leading-relaxed text-ink-soft">
              {t("introBody")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* As duas perguntas */}
      <section className="relative overflow-hidden bg-green-deep text-cream">
        <div className="gradient-mesh pointer-events-none absolute inset-0 opacity-50" />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-16 select-none font-serif text-[22rem] leading-none text-cream/[0.05]"
        >
          ?
        </span>
        <div className="relative mx-auto max-w-5xl px-6 py-24">
          <Reveal>
            <p className="kicker text-cream/50">{tb("kicker")}</p>
            <h2 className="mt-4 max-w-2xl text-3xl text-cream md:text-4xl">
              {t("questionsTitle")}
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-10 md:grid-cols-2">
            {[t("q1"), t("q2")].map((q, i) => (
              <Reveal key={i} delay={i * 140}>
                <div className="flex gap-5">
                  <span className="font-serif text-5xl font-semibold leading-none text-cream/25">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="font-serif text-2xl italic leading-snug text-cream/90 md:text-[1.7rem]">
                    {q}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* A ECP — o eixo */}
      <section className="bg-bone">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-wine/30 bg-wine/5 px-3.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-wine">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-wine" />
              {t("ecpBadge")}
            </span>
          </Reveal>
          <Reveal delay={120}>
            <h2 className="mt-6 text-3xl text-green-deep md:text-5xl">
              {t("ecpTitle")}
            </h2>
          </Reveal>
          <Reveal delay={240}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
              {t("ecpBody")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Conceitos-pilar */}
      {concepts.length > 0 && (
        <section className="bg-cream">
          <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
            <Reveal>
              <h2 className="text-3xl text-green-deep md:text-4xl">
                {t("conceptsTitle")}
              </h2>
              <p className="mt-3 text-ink-soft">{t("conceptsLead")}</p>
            </Reveal>
            <ul className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
              {concepts.map((c, i) => (
                <li key={c.slug}>
                  <Link
                    href={`/conceitos/${c.slug}`}
                    className="group flex items-baseline gap-5 py-7 transition-colors hover:bg-bone sm:gap-8"
                  >
                    <span className="font-serif text-2xl italic leading-none text-wine/50 transition-colors group-hover:text-wine">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
                        <h3 className="min-w-[16rem] font-serif text-2xl italic text-green-deep transition-colors group-hover:text-wine">
                          {c.title}
                        </h3>
                        {c.shortDefinition && (
                          <span className="text-ink-soft">{c.shortDefinition}</span>
                        )}
                      </span>
                    </span>
                    <span
                      className="hidden self-center text-wine opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 sm:block"
                      aria-hidden
                    >
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* CTA — onde a tese vira prática */}
      <section className="relative overflow-hidden bg-wine text-cream">
        <div className="blob animate-float absolute -right-16 -top-16 h-72 w-72 bg-cream/15" />
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <Reveal>
            <h2 className="text-3xl italic text-cream md:text-4xl">
              {t("ctaTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-cream/85">{t("ctaBody")}</p>
            <Link
              href="/artigos-e-perguntas"
              className="group mt-9 inline-flex items-center gap-2 rounded-full bg-cream px-7 py-3.5 text-sm font-semibold text-wine transition-all hover:gap-3 hover:bg-white"
            >
              {t("cta")}
              <span className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
