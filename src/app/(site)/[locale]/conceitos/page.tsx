import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import PageBanner from "@/components/PageBanner";
import LibrarySearch from "@/components/LibrarySearch";
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
  const t = await getTranslations({ locale, namespace: "libraries" });
  return {
    title: t("concepts.name"),
    description: t("concepts.desc"),
    alternates: alternatesFor("/conceitos"),
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
  const items = await sanityFetch<CItem[]>(conceptsListQuery, { locale });

  return (
    <>
      <PageBanner
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("libraries.concepts.name") },
        ]}
        title={t("libraries.concepts.name")}
        lead={t("libraries.concepts.desc")}
      />
      <section className="bg-cream">
        <div className="mx-auto max-w-5xl px-6 py-16">
          {items.length === 0 ? (
            <p className="text-ink-soft">{t("common.empty")}</p>
          ) : (
            <LibrarySearch
              variant="concepts"
              placeholder={t("search.quickPlaceholder")}
              noResultsLabel={t("search.noResults")}
              items={items.map((c) => ({
                slug: c.slug,
                title: c.title,
                text: c.shortDefinition,
              }))}
            />
          )}
        </div>
      </section>
    </>
  );
}
