import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import PageBanner from "@/components/PageBanner";
import LibrarySearch from "@/components/LibrarySearch";
import { sanityFetch } from "@/sanity/lib/fetch";
import { casesListQuery } from "@/sanity/lib/queries";
import { alternatesFor } from "@/lib/seo";

type CaseItem = { title: string; slug: string; description?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "libraries" });
  return {
    title: t("cases.name"),
    description: t("cases.desc"),
    alternates: alternatesFor("/casos"),
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
  const items = await sanityFetch<CaseItem[]>(casesListQuery, { locale });

  return (
    <>
      <PageBanner
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("libraries.cases.name") },
        ]}
        title={t("libraries.cases.name")}
        lead={t("libraries.cases.desc")}
      />
      <section className="bg-cream">
        <div className="mx-auto max-w-5xl px-6 py-16">
          {items.length === 0 ? (
            <p className="text-ink-soft">{t("common.empty")}</p>
          ) : (
            <LibrarySearch
              variant="cases"
              placeholder={t("search.quickPlaceholder")}
              noResultsLabel={t("search.noResults")}
              items={items.map((c) => ({
                slug: c.slug,
                title: c.title,
                text: c.description,
              }))}
            />
          )}
        </div>
      </section>
    </>
  );
}
