import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import PageBanner from "@/components/PageBanner";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const tp = await getTranslations({ locale, namespace: "mediaPage" });
  return pageMetadata({
    title: t("media"),
    description: tp("headline"),
    path: "/na-midia",
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
  const t = await getTranslations("mediaPage");
  const tc = await getTranslations("common");
  const tn = await getTranslations("nav");

  return (
    <>
      <PageBanner
        crumbs={[{ label: tc("home"), href: "/" }, { label: tn("media") }]}
        badge={t("badge")}
        title={tn("media")}
        lead={t("headline")}
      />

      {/* Aparições e publicações — estado inicial */}
      <section className="bg-bone">
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
