import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import PageBanner from "@/components/PageBanner";
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
import { caseBySlugQuery } from "@/sanity/lib/queries";
import { localizedUrl, pageMetadata } from "@/lib/seo";

// Export estático: pré-gera todos os casos publicados.
export async function generateStaticParams() {
  const slugs = await client.fetch<string[]>(
    `*[_type == "caseStudy" && defined(slug.current)].slug.current`,
  );
  return slugs.map((slug) => ({ slug }));
}

type Related = { title: string; slug: string };
type CaseDetail = {
  title: string;
  slug: string;
  description?: string;
  pattern?: unknown;
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
  const c = await sanityFetch<CaseDetail>(caseBySlugQuery, { locale, slug });
  if (!c) return {};
  return pageMetadata({
    title: c.metaTitle || c.title,
    description: c.metaDescription || c.description,
    path: `/casos/${slug}`,
    locale,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const c = await sanityFetch<CaseDetail>(caseBySlugQuery, { locale, slug });
  if (!c) notFound();

  const pageUrl = localizedUrl(locale, `/casos/${slug}`);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("common.home"), item: localizedUrl(locale, "/") },
      { "@type": "ListItem", position: 2, name: t("libraries.cases.name"), item: localizedUrl(locale, "/casos") },
      { "@type": "ListItem", position: 3, name: c.title, item: pageUrl },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbLd} />
      <PageBanner
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("libraries.cases.name"), href: "/casos" },
          { label: c.title },
        ]}
        badge={t("libraries.cases.badge")}
        title={c.title}
        lead={c.description}
      />

      <section className="bg-cream">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
          <article className="min-w-0 max-w-3xl">
            <div className="drop-cap text-[1.06rem]">
              <PortableTextBody value={c.pattern} />
            </div>

            <EndOrnament backHref="/casos" backLabel={t("libraries.cases.name")} />
          </article>

          <aside className="min-w-0 space-y-6 self-start lg:sticky lg:top-24">
            <AuthorCard />

            {c.relatedConcepts && c.relatedConcepts.length > 0 && (
              <SideCard label={t("common.relatedConcepts")}>
                <ChipLinks items={c.relatedConcepts} basePath="/conceitos" />
              </SideCard>
            )}

            {c.relatedQuestions && c.relatedQuestions.length > 0 && (
              <SideCard label={t("common.relatedQuestions")}>
                <LinkList items={c.relatedQuestions} basePath="/perguntas" />
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
