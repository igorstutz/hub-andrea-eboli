import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import DetailHeader from "@/components/DetailHeader";
import PortableTextBody from "@/components/PortableTextBody";
import AuthorCard from "@/components/AuthorCard";
import SideCard from "@/components/SideCard";
import ChipLinks from "@/components/ChipLinks";
import LinkList from "@/components/LinkList";
import EndOrnament from "@/components/EndOrnament";
import CopyLinkButton from "@/components/CopyLinkButton";
import JsonLd from "@/components/JsonLd";
import { sanityFetch } from "@/sanity/lib/fetch";
import { client } from "@/sanity/lib/client";
import { questionBySlugQuery } from "@/sanity/lib/queries";
import { alternatesFor, localizedUrl } from "@/lib/seo";

// Export estático: pré-gera todas as perguntas publicadas.
export async function generateStaticParams() {
  const slugs = await client.fetch<string[]>(
    `*[_type == "question" && defined(slug.current)].slug.current`,
  );
  return slugs.map((slug) => ({ slug }));
}

type Related = { title: string; slug: string };
type QDetail = {
  title: string;
  slug: string;
  experience?: string;
  answer?: string;
  body?: unknown;
  topic?: { title: string; slug: string } | null;
  relatedConcepts?: Related[] | null;
  relatedQuestions?: Related[] | null;
  metaTitle?: string;
  metaDescription?: string;
} | null;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const q = await sanityFetch<QDetail>(questionBySlugQuery, { locale, slug });
  if (!q) return {};
  return {
    title: q.metaTitle || q.title,
    description: q.metaDescription || q.answer,
    alternates: alternatesFor(`/perguntas/${slug}`),
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const q = await sanityFetch<QDetail>(questionBySlugQuery, { locale, slug });
  if (!q) notFound();

  const pageUrl = localizedUrl(locale, `/perguntas/${slug}`);

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: q.title,
        acceptedAnswer: { "@type": "Answer", text: q.answer ?? "" },
      },
    ],
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("common.home"), item: localizedUrl(locale, "/") },
      { "@type": "ListItem", position: 2, name: t("libraries.questions.name"), item: localizedUrl(locale, "/perguntas") },
      { "@type": "ListItem", position: 3, name: q.title, item: pageUrl },
    ],
  };

  return (
    <>
      <JsonLd data={faqLd} />
      <JsonLd data={breadcrumbLd} />
      <DetailHeader
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("libraries.questions.name"), href: "/perguntas" },
          { label: q.title },
        ]}
        badge={q.topic?.title ?? t("libraries.questions.badge")}
        title={q.title}
        lead={q.experience}
      />

      <section className="bg-cream">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
          <article className="min-w-0 max-w-3xl">
            {q.answer && (
              <div
                id="resposta-direta"
                className="mb-10 rounded-r-lg border-l-2 border-wine bg-bone/60 px-6 py-5"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-soft">
                  {t("common.directAnswer")}
                </p>
                <p className="font-serif text-2xl leading-snug text-green-deep">
                  {q.answer}
                </p>
              </div>
            )}

            <div className="drop-cap text-[1.06rem]">
              <PortableTextBody value={q.body} />
            </div>

            <EndOrnament
              backHref="/perguntas"
              backLabel={t("libraries.questions.name")}
            />
          </article>

          <aside className="min-w-0 space-y-6 self-start lg:sticky lg:top-24">
            <AuthorCard />

            {q.relatedConcepts && q.relatedConcepts.length > 0 && (
              <SideCard label={t("common.relatedConcepts")}>
                <ChipLinks items={q.relatedConcepts} basePath="/conceitos" />
              </SideCard>
            )}

            {q.relatedQuestions && q.relatedQuestions.length > 0 && (
              <SideCard label={t("common.relatedQuestions")}>
                <LinkList items={q.relatedQuestions} basePath="/perguntas" />
              </SideCard>
            )}

            <CopyLinkButton
              url={pageUrl}
              label={t("videoPage.copyLink")}
              copiedLabel={t("videoPage.copied")}
            />
          </aside>
        </div>
      </section>
    </>
  );
}
