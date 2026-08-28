import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import PageBanner from "@/components/PageBanner";
import LibrarySearch from "@/components/LibrarySearch";
import { sanityFetch } from "@/sanity/lib/fetch";
import { articlesListQuery } from "@/sanity/lib/queries";
import { pageMetadata } from "@/lib/seo";
import {
  normalizeArticleSource,
  presentArticleSources,
} from "@/lib/articleSources";

type ArticleItem = {
  title: string;
  slug: string;
  kind?: string;
  source?: string;
  excerpt?: string;
  publishedAt?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "libraries" });
  return pageMetadata({
    title: t("articles.name"),
    description: t("articles.desc"),
    path: "/artigos",
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
  const t = await getTranslations();
  const items = await sanityFetch<ArticleItem[]>(articlesListQuery, { locale });

  return (
    <>
      <PageBanner
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("libraries.articles.name") },
        ]}
        title={t("libraries.articles.name")}
        lead={t("libraries.articles.desc")}
      />
      <section className="bg-cream">
        <div className="mx-auto max-w-5xl px-6 py-16">
          {items.length === 0 ? (
            <p className="text-ink-soft">{t("common.empty")}</p>
          ) : (
            <LibrarySearch
              variant="articles"
              placeholder={t("search.quickPlaceholder")}
              noResultsLabel={t("search.noResults")}
              filtersLabel={t("articleSources.label")}
              allLabel={t("articleSources.all")}
              filters={presentArticleSources(items).map((s) => ({
                value: s,
                label: t(`articleSources.${s}`),
              }))}
              items={items.map((a) => {
                const source = normalizeArticleSource(a.source);
                return {
                  slug: a.slug,
                  title: a.title,
                  badge: a.kind ? t(`articleKinds.${a.kind}`) : undefined,
                  // "original" não vira chip no card: só as fontes externas.
                  tag:
                    source === "original"
                      ? undefined
                      : t(`articleSources.${source}`),
                  filter: source,
                  meta: a.publishedAt
                    ? new Intl.DateTimeFormat(locale, {
                        dateStyle: "long",
                      }).format(new Date(a.publishedAt))
                    : undefined,
                  text: a.excerpt,
                };
              })}
            />
          )}
        </div>
      </section>
    </>
  );
}
