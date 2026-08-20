import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageBanner from "@/components/PageBanner";
import EvidenceIntro from "@/components/EvidenceIntro";
import Reveal from "@/components/Reveal";
import { alternatesFor } from "@/lib/seo";
import { asset } from "@/lib/assetPath";

/* ------------------------------------------------------------------
   DADOS DA PESQUISA — preencher quando a Andrea enviar os números.

   STATS      → os "dois ou três percentuais de maior impacto".
   CHART_SRC  → o gráfico principal, já redesenhado na identidade do site e
                COM A MARCA D'ÁGUA GRAVADA NO ARQUIVO. Isso é importante: a
                marca d'água em CSS por cima é só atrito visual, quem quiser
                baixa a imagem original. A proteção real é a do próprio arquivo.
   METHOD     → nota curta de amostra e metodologia.
   RESEARCH_URL → destino do botão "Conheça a pesquisa" (deck, PDF, página).
                Enquanto for null o botão não aparece.
------------------------------------------------------------------- */
const STATS: { value: string; label: string }[] = [];
const CHART_SRC: string | null = null;
const METHOD: string | null = null;
const RESEARCH_URL: string | null = null;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "researchPage" });
  return {
    title: t("title"),
    description: t("headline"),
    alternates: alternatesFor("/pesquisa"),
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("researchPage");
  const tc = await getTranslations("common");
  const tn = await getTranslations("nav");

  return (
    <>
      <PageBanner
        crumbs={[{ label: tc("home"), href: "/" }, { label: tn("research") }]}
        badge={t("badge")}
        title={t("title")}
        lead={t("headline")}
      />

      <EvidenceIntro />

      {/* Percentuais de maior impacto */}
      <section className="border-t border-ink/10 bg-bone">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <Reveal>
            <h2 className="text-3xl text-green-deep md:text-4xl">
              {t("findingsLabel")}
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {(STATS.length > 0
              ? STATS
              : [{ value: "", label: "" }, { value: "", label: "" }, { value: "", label: "" }]
            ).map((s, i) => (
              <Reveal key={i} delay={i * 110}>
                <div className="relative overflow-hidden rounded-2xl border border-wine/15 bg-cream p-8">
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-wine-soft to-green-deep" />
                  {s.value ? (
                    <>
                      <p className="font-serif text-5xl font-semibold leading-none text-wine">
                        {s.value}
                      </p>
                      <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                        {s.label}
                      </p>
                    </>
                  ) : (
                    <>
                      <p
                        aria-hidden
                        className="font-serif text-5xl font-semibold leading-none text-wine/20"
                      >
                        00%
                      </p>
                      <span className="mt-5 block h-2 w-full rounded-full bg-wine/10" />
                      <span className="mt-2 block h-2 w-2/3 rounded-full bg-wine/10" />
                    </>
                  )}
                </div>
              </Reveal>
            ))}
          </div>

          {STATS.length === 0 && (
            <p className="mt-8 font-serif text-lg italic text-muted">
              {t("soon")}
            </p>
          )}
        </div>
      </section>

      {/* Gráfico principal + amostra e metodologia */}
      <section className="bg-cream">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1.5fr_1fr] md:gap-16">
          <div>
            <Reveal>
              <p className="kicker text-wine">{t("chartLabel")}</p>
            </Reveal>
            <Reveal delay={100}>
              {CHART_SRC ? (
                /* A marca d'água precisa estar GRAVADA no arquivo. O
                   select-none / draggable=false abaixo é só atrito: não existe
                   forma de impedir a captura de uma imagem na web. */
                <div className="relative mt-5 select-none overflow-hidden rounded-2xl border border-ink/10 bg-bone">
                  <Image
                    src={asset(CHART_SRC)}
                    alt={t("chartLabel")}
                    width={1600}
                    height={1000}
                    draggable={false}
                    className="pointer-events-none w-full"
                  />
                </div>
              ) : (
                <div className="mt-5 flex aspect-[8/5] items-end gap-3 rounded-2xl border border-dashed border-ink/15 bg-bone p-8">
                  {[38, 62, 47, 80, 55].map((h, i) => (
                    <span
                      key={i}
                      aria-hidden
                      className="flex-1 rounded-t-md bg-wine/12"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              )}
            </Reveal>
          </div>

          <aside className="md:pt-9">
            <Reveal delay={200}>
              <p className="kicker text-wine">{t("methodologyLabel")}</p>
              {METHOD ? (
                <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                  {METHOD}
                </p>
              ) : (
                <p className="mt-4 font-serif text-lg italic text-muted">
                  {t("methodologySoon")}
                </p>
              )}
            </Reveal>

            {RESEARCH_URL && (
              <Reveal delay={280}>
                <a
                  href={RESEARCH_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-8 inline-flex items-center gap-2 rounded-full bg-wine px-6 py-3.5 text-sm font-semibold text-cream transition-all hover:gap-3 hover:bg-wine-deep"
                >
                  {t("cta")}
                  <span className="transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </a>
              </Reveal>
            )}
          </aside>
        </div>
      </section>

      {/* Ponte para a Confraria — a outra metade do par */}
      <section className="relative overflow-hidden bg-wine text-cream">
        <div className="blob animate-float absolute -right-16 -top-16 h-72 w-72 bg-cream/15" />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center">
          <Reveal>
            <h2 className="text-3xl italic md:text-4xl">{t("crossTitle")}</h2>
            <p className="mx-auto mt-4 max-w-xl text-cream/85">
              {t("crossBody")}
            </p>
            <Link
              href="/confraria"
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-cream px-7 py-3.5 text-sm font-semibold text-wine transition-all hover:gap-3 hover:bg-white"
            >
              {t("crossCta")}
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
