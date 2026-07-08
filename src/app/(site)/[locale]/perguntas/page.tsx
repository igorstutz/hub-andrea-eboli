import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import PageHeader from "@/components/PageHeader";
import LibrarySearch from "@/components/LibrarySearch";
import { sanityFetch } from "@/sanity/lib/fetch";
import { questionsListQuery } from "@/sanity/lib/queries";
import { alternatesFor } from "@/lib/seo";

type QItem = {
  title: string;
  slug: string;
  answer?: string;
  topic?: { title: string; slug: string } | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "libraries" });
  return {
    title: t("questions.name"),
    description: t("questions.desc"),
    alternates: alternatesFor("/perguntas"),
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
  const items = await sanityFetch<QItem[]>(questionsListQuery, { locale });

  return (
    <>
      <PageHeader
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("libraries.questions.name") },
        ]}
        title={t("libraries.questions.name")}
        lead={t("libraries.questions.desc")}
      />
      <section className="bg-cream">
        <div className="mx-auto max-w-5xl px-6 py-16">
          {items.length === 0 ? (
            <p className="text-ink-soft">{t("common.empty")}</p>
          ) : (
            <LibrarySearch
              variant="questions"
              placeholder={t("search.quickPlaceholder")}
              noResultsLabel={t("search.noResults")}
              items={items.map((q) => ({
                slug: q.slug,
                title: q.title,
                badge: q.topic?.title,
                text: q.answer,
              }))}
            />
          )}
        </div>
      </section>
    </>
  );
}
