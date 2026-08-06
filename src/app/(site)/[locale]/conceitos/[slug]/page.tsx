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
import { conceptBySlugQuery } from "@/sanity/lib/queries";
import { alternatesFor, localizedUrl } from "@/lib/seo";

// Export estático: pré-gera todos os conceitos publicados.
export async function generateStaticParams() {
  const slugs = await client.fetch<string[]>(
    `*[_type == "concept" && defined(slug.current)].slug.current`,
  );
  return slugs.map((slug) => ({ slug }));
}

type Related = { title: string; slug: string };
type CDetail = {
  title: string;
  slug: string;
  shortDefinition?: string;
  fullDefinition?: unknown;
  relatedConcepts?: Related[] | null;
  referencedByConcepts?: Related[] | null;
  relatedQuestions?: Related[] | null;
  relatedCases?: Related[] | null;
  relatedArticles?: Related[] | null;
  relatedVideos?: Related[] | null;
} | null;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const c = await sanityFetch<CDetail>(conceptBySlugQuery, { locale, slug });
  if (!c) return {};
  return {
    title: c.title,
    description: c.shortDefinition,
    alternates: alternatesFor(`/conceitos/${slug}`),
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
  const c = await sanityFetch<CDetail>(conceptBySlugQuery, { locale, slug });
  if (!c) notFound();

  const pageUrl = localizedUrl(locale, `/conceitos/${slug}`);

  // Conceitos relacionados: união dos que este conceito aponta + dos que apontam para ele.
  const conceptMap = new Map<string, Related>();
  for (const r of [...(c.relatedConcepts ?? []), ...(c.referencedByConcepts ?? [])]) {
    if (r?.slug && r.slug !== c.slug) conceptMap.set(r.slug, r);
  }
  const concepts = [...conceptMap.values()];

  const definedTermLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: c.title,
    description: c.shortDefinition ?? "",
    inDefinedTermSet: { "@type": "DefinedTermSet", name: "Ser Poder" },
  };

  return (
    <>
      <JsonLd data={definedTermLd} />
      <PageBanner
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("libraries.concepts.name"), href: "/conceitos" },
          { label: c.title },
        ]}
        badge={t("libraries.concepts.badge")}
        title={c.title}
        lead={c.shortDefinition}
      />

      <section className="bg-cream">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
          <article className="min-w-0 max-w-3xl">
            <div className="drop-cap text-[1.06rem]">
              <PortableTextBody value={c.fullDefinition} />
            </div>

            {concepts.length > 0 && (
              <div className="mt-12">
                <h2 className="mb-4 text-xl text-green-deep">
                  {t("common.relatedConcepts")}
                </h2>
                <ChipLinks items={concepts} basePath="/conceitos" />
              </div>
            )}

            <EndOrnament
              backHref="/conceitos"
              backLabel={t("libraries.concepts.name")}
            />
          </article>

          {/* O conceito é o pilar: a sidebar agrega tudo no hub ligado a ele. */}
          <aside className="min-w-0 space-y-6 self-start lg:sticky lg:top-24">
            {c.relatedQuestions && c.relatedQuestions.length > 0 && (
              <SideCard label={t("common.relatedQuestions")}>
                <LinkList items={c.relatedQuestions} basePath="/perguntas" />
              </SideCard>
            )}

            {c.relatedCases && c.relatedCases.length > 0 && (
              <SideCard label={t("common.relatedCases")}>
                <LinkList items={c.relatedCases} basePath="/casos" />
              </SideCard>
            )}

            {c.relatedArticles && c.relatedArticles.length > 0 && (
              <SideCard label={t("common.relatedArticles")}>
                <LinkList items={c.relatedArticles} basePath="/artigos" />
              </SideCard>
            )}

            {c.relatedVideos && c.relatedVideos.length > 0 && (
              <SideCard label={t("common.relatedVideos")}>
                <LinkList items={c.relatedVideos} basePath="/videos" />
              </SideCard>
            )}

            <AuthorCard />

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
