import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import PageBanner from "@/components/PageBanner";
import LibrarySearch from "@/components/LibrarySearch";
import { sanityFetch } from "@/sanity/lib/fetch";
import { casesListQuery } from "@/sanity/lib/queries";
import { pageMetadata } from "@/lib/seo";
import { getPageText } from "@/lib/pageText";

type CaseItem = { title: string; slug: string; description?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { tx: t } = await getPageText("librariesText", "libraries", locale);
  return pageMetadata({
    title: t("cases.name"),
    description: t("cases.desc"),
    path: "/casos",
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
  // Nomes das bibliotecas: painel → Bibliotecas (a tradução é a reserva).
  const { tx: lib } = await getPageText("librariesText", "libraries", locale);
  const t = await getTranslations();
  const items = await sanityFetch<CaseItem[]>(casesListQuery, { locale });

  return (
    <>
      <PageBanner
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: lib("cases.name") },
        ]}
        title={lib("cases.name")}
        lead={lib("cases.desc")}
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
