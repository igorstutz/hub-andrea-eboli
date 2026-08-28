import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import PageBanner from "@/components/PageBanner";
import GlobalSearchClient from "@/components/GlobalSearchClient";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "search" });
  return {
    title: t("title"),
    alternates: alternatesFor("/busca", locale),
    robots: { index: false },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <>
      <PageBanner
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("search.title") },
        ]}
        title={t("search.title")}
      />
      <section className="bg-cream">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <GlobalSearchClient
            labels={{
              placeholder: t("search.placeholder"),
              button: t("search.button"),
              prompt: t("search.prompt"),
              noResults: t("search.noResults"),
              resultsFor: t("search.resultsFor"),
            }}
          />
        </div>
      </section>
    </>
  );
}
