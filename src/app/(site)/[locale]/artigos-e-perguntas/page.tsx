import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageBanner from "@/components/PageBanner";
import LibrarySearch from "@/components/LibrarySearch";
import SectionOrderToggle from "@/components/SectionOrderToggle";
import { sanityFetch } from "@/sanity/lib/fetch";
import { questionsListQuery, articlesListQuery } from "@/sanity/lib/queries";
import { alternatesFor } from "@/lib/seo";
import {
  normalizeArticleSource,
  presentArticleSources,
} from "@/lib/articleSources";

type QItem = {
  title: string;
  slug: string;
  answer?: string;
  topic?: { title: string; slug: string } | null;
};
type AItem = {
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
  const t = await getTranslations({ locale, namespace: "nav" });
  const tp = await getTranslations({ locale, namespace: "articlesQuestionsPage" });
  return {
    title: t("articlesQuestions"),
    description: tp("headline"),
    alternates: alternatesFor("/artigos-e-perguntas"),
  };
}

function SectionTitle({ title, cta, href }: { title: string; cta: string; href: string }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <h2 className="text-3xl text-green-deep md:text-4xl">{title}</h2>
      <Link
        href={href}
        className="group inline-flex items-center gap-2 text-sm font-medium text-wine transition-all hover:gap-3"
      >
        {cta}
        <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </Link>
    </div>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const tp = await getTranslations("articlesQuestionsPage");
  const tb = await getTranslations("banner");

  const [questions, articles] = await Promise.all([
    sanityFetch<QItem[]>(questionsListQuery, { locale }),
    sanityFetch<AItem[]>(articlesListQuery, { locale }),
  ]);

  return (
    <>
      <PageBanner
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("nav.articlesQuestions") },
        ]}
        badge={tp("badge")}
        kicker={tb("kicker")}
        title={t("nav.articlesQuestions")}
        lead={tp("headline")}
      />

      {/* O toggle escolhe qual bloco vem primeiro (temporário — sai quando os
          artigos tiverem página própria). */}
      <SectionOrderToggle
        label={tp("orderLabel")}
        questionsLabel={tp("questionsTitle")}
        articlesLabel={tp("articlesTitle")}
        questions={
          <>
            <SectionTitle
              title={tp("questionsTitle")}
              cta={tp("questionsCta")}
              href="/perguntas"
            />
            {questions.length === 0 ? (
              <p className="text-ink-soft">{t("common.empty")}</p>
            ) : (
              <LibrarySearch
                variant="questions"
                placeholder={t("search.quickPlaceholder")}
                noResultsLabel={t("search.noResults")}
                items={questions.map((q) => ({
                  slug: q.slug,
                  title: q.title,
                  badge: q.topic?.title,
                  text: q.answer,
                }))}
              />
            )}
          </>
        }
        articles={
          <>
            <SectionTitle
              title={tp("articlesTitle")}
              cta={tp("articlesCta")}
              href="/artigos"
            />
            {articles.length === 0 ? (
              <p className="text-ink-soft">{t("common.empty")}</p>
            ) : (
              <LibrarySearch
                variant="articles"
                placeholder={t("search.quickPlaceholder")}
                noResultsLabel={t("search.noResults")}
                filtersLabel={t("articleSources.label")}
                allLabel={t("articleSources.all")}
                filters={presentArticleSources(articles).map((s) => ({
                  value: s,
                  label: t(`articleSources.${s}`),
                }))}
                items={articles.map((a) => {
                  const source = normalizeArticleSource(a.source);
                  return {
                    slug: a.slug,
                    title: a.title,
                    badge: a.kind ? t(`articleKinds.${a.kind}`) : undefined,
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
          </>
        }
      />
    </>
  );
}
