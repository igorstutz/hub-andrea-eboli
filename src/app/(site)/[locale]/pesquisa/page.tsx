import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageBanner from "@/components/PageBanner";
import EvidenceIntro from "@/components/EvidenceIntro";
import Reveal from "@/components/Reveal";
import { pageMetadata } from "@/lib/seo";
import { asset } from "@/lib/assetPath";

/* ------------------------------------------------------------------
   DADOS DA PESQUISA ECP (base: 403 respondentes).

   Os números vêm do deck da pesquisa e do documento de análise de hipóteses
   que a Andrea enviou. Os TEXTOS moram no i18n (`researchPage.*`), porque a
   página é trilíngue; aqui ficam só as chaves e a estrutura.

   STATS       → os três percentuais de maior impacto.
   DIMENSIONS  → os dados lidos pelas três dimensões da ECP, que é o que liga
                 a pesquisa ao vocabulário do resto do site.
   CHART_BY_LOCALE → o gráfico principal, desenhado na identidade do site por
                 `gera-grafico-pesquisa.mjs`, um arquivo por idioma e COM A
                 MARCA D'ÁGUA GRAVADA. Isso importa: marca d'água em CSS por
                 cima é só atrito, quem quiser baixa a imagem original.
   RESEARCH_URL → destino do botão "Conheça a pesquisa" (deck, PDF, página).
                 Enquanto for null o botão não aparece.
------------------------------------------------------------------- */
const STATS = [
  { valueKey: "stat1Value", labelKey: "stat1Label" },
  { valueKey: "stat2Value", labelKey: "stat2Label" },
  { valueKey: "stat3Value", labelKey: "stat3Label" },
] as const;

const DIMENSIONS = [
  {
    nameKey: "dimIdentityName",
    factKeys: ["dimIdentityFact1", "dimIdentityFact2"],
    num: "01",
  },
  {
    nameKey: "dimContextName",
    factKeys: ["dimContextFact1", "dimContextFact2"],
    num: "02",
  },
  {
    nameKey: "dimMovementName",
    factKeys: ["dimMovementFact1", "dimMovementFact2"],
    num: "03",
  },
] as const;

const CHART_BY_LOCALE: Record<string, string> = {
  pt: "/pesquisa/pesquisa-ecp-o-que-e-poder-pt.webp",
  en: "/pesquisa/pesquisa-ecp-o-que-e-poder-en.webp",
  es: "/pesquisa/pesquisa-ecp-o-que-e-poder-es.webp",
};

const RESEARCH_URL: string | null = null;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "researchPage" });
  return pageMetadata({
    title: t("title"),
    description: t("headline"),
    path: "/pesquisa",
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
            {STATS.map((s, i) => (
              <Reveal key={s.valueKey} delay={i * 110}>
                <div className="relative h-full overflow-hidden rounded-2xl border border-wine/15 bg-cream p-8">
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-wine-soft to-green-deep" />
                  <p className="font-serif text-5xl font-semibold leading-none text-wine">
                    {t(s.valueKey)}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                    {t(s.labelKey)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Os mesmos dados lidos pelas três dimensões da ECP: é o que amarra a
          pesquisa ao vocabulário do resto do site. */}
      <section className="border-t border-ink/10 bg-cream">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <Reveal>
            <h2 className="text-3xl text-green-deep md:text-4xl">
              {t("dimensionsLabel")}
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-4 max-w-2xl text-ink-soft">{t("dimensionsLead")}</p>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {DIMENSIONS.map((d, i) => (
              <Reveal key={d.nameKey} delay={i * 110}>
                <div className="h-full rounded-2xl border border-ink/10 bg-bone p-8">
                  <span className="font-serif text-3xl italic leading-none text-green-deep/35">
                    {d.num}
                  </span>
                  <h3 className="mt-4 font-serif text-2xl italic text-wine">
                    {t(d.nameKey)}
                  </h3>
                  <ul className="mt-5 space-y-4">
                    {d.factKeys.map((k) => (
                      <li
                        key={k}
                        className="border-l-2 border-wine/20 pl-4 text-sm leading-relaxed text-ink-soft"
                      >
                        {t(k)}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={340}>
            <p className="mt-10 max-w-3xl border-l-2 border-green-deep/30 pl-5 font-serif text-lg italic leading-relaxed text-green-deep">
              {t("dimensionsClose")}
            </p>
          </Reveal>
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
              {/* A marca d'água está GRAVADA no arquivo. O select-none e o
                  draggable={false} abaixo são só atrito: não existe forma de
                  impedir a captura de uma imagem na web. */}
              <div className="relative mt-5 select-none overflow-hidden rounded-2xl border border-ink/10 bg-bone">
                <Image
                  src={asset(CHART_BY_LOCALE[locale] ?? CHART_BY_LOCALE.pt)}
                  alt={t("chartAlt")}
                  width={1600}
                  height={1000}
                  draggable={false}
                  className="pointer-events-none w-full"
                />
              </div>
            </Reveal>
          </div>

          <aside className="md:pt-9">
            <Reveal delay={200}>
              <p className="kicker text-wine">{t("methodologyLabel")}</p>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                {t("method")}
              </p>
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
