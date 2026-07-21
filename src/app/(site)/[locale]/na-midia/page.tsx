import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import PageBanner from "@/components/PageBanner";
import Reveal from "@/components/Reveal";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return {
    title: t("media"),
    alternates: alternatesFor("/na-midia"),
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("mediaPage");
  const tc = await getTranslations("common");
  const tn = await getTranslations("nav");
  const th = await getTranslations("home");
  const credentials = th.raw("credentials") as string[];

  return (
    <>
      <PageBanner
        crumbs={[{ label: tc("home"), href: "/" }, { label: tn("media") }]}
        badge={t("badge")}
        title={tn("media")}
        lead={t("headline")}
      />

      {/* Reconhecida por (migrado do banner da home) */}
      <section className="bg-cream">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <Reveal>
            <h2 className="text-3xl text-green-deep md:text-4xl">
              {t("recognitionTitle")}
            </h2>
            <p className="mt-3 max-w-2xl text-ink-soft">{t("recognitionLead")}</p>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {credentials.map((c, i) => (
              <Reveal key={c} delay={i * 60}>
                <div className="group flex h-24 items-center justify-center rounded-xl border border-ink/10 bg-bone px-4 text-center transition-all hover:-translate-y-1 hover:border-wine/30 hover:shadow-[0_24px_50px_-32px_rgba(20,49,44,0.4)]">
                  <span className="font-serif text-lg italic leading-tight text-green-deep transition-colors group-hover:text-wine">
                    {c}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Aparições e publicações — estado inicial */}
      <section className="border-t border-ink/10 bg-bone">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-3xl text-green-deep md:text-4xl">
            {t("pressTitle")}
          </h2>
          <div className="mt-10 rounded-2xl border border-dashed border-ink/15 bg-cream px-6 py-16 text-center">
            <p className="mx-auto max-w-md text-ink-soft">{t("empty")}</p>
          </div>
        </div>
      </section>
    </>
  );
}
