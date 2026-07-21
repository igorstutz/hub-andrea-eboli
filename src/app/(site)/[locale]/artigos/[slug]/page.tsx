import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import DetailHeader from "@/components/DetailHeader";
import PortableTextBody from "@/components/PortableTextBody";
import AuthorCard from "@/components/AuthorCard";
import SideCard from "@/components/SideCard";
import ChipLinks from "@/components/ChipLinks";
import EndOrnament from "@/components/EndOrnament";
import CopyLinkButton from "@/components/CopyLinkButton";
import JsonLd from "@/components/JsonLd";
import { sanityFetch } from "@/sanity/lib/fetch";
import { client } from "@/sanity/lib/client";
import { articleBySlugQuery } from "@/sanity/lib/queries";
import { slugify } from "@/lib/portableText";
import { alternatesFor, localizedUrl } from "@/lib/seo";

// Export estático: pré-gera todos os artigos publicados.
export async function generateStaticParams() {
  const slugs = await client.fetch<string[]>(
    `*[_type == "article" && defined(slug.current)].slug.current`,
  );
  return slugs.map((slug) => ({ slug }));
}

type Related = { title: string; slug: string };
type ArticleDetail = {
  title: string;
  slug: string;
  kind?: string;
  excerpt?: string;
  body?: unknown;
  publishedAt?: string;
  pdfUrl?: string | null;
  relatedConcepts?: Related[] | null;
  metaTitle?: string;
  metaDescription?: string;
} | null;

// Bloco do Portable Text (o suficiente para sumário e tempo de leitura).
type PTBlock = { _type?: string; style?: string; children?: Array<{ text?: string }> };

const blockText = (b: PTBlock) =>
  (b.children ?? []).map((c) => c.text ?? "").join("");

function analyzeBody(body: unknown) {
  const blocks = Array.isArray(body) ? (body as PTBlock[]) : [];
  const toc = blocks
    .filter((b) => b._type === "block" && b.style === "h2")
    .map((b) => {
      const text = blockText(b);
      return { text, id: slugify(text) };
    })
    .filter((h) => h.text && h.id);
  const words = blocks
    .map(blockText)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return { toc, minutes, words };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const a = await sanityFetch<ArticleDetail>(articleBySlugQuery, { locale, slug });
  if (!a) return {};
  return {
    title: a.metaTitle || a.title,
    description: a.metaDescription || a.excerpt,
    alternates: alternatesFor(`/artigos/${slug}`),
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
  const a = await sanityFetch<ArticleDetail>(articleBySlugQuery, { locale, slug });
  if (!a) notFound();

  const pageUrl = localizedUrl(locale, `/artigos/${slug}`);
  const { toc, minutes, words } = analyzeBody(a.body);
  const dateLabel = a.publishedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
        new Date(a.publishedAt),
      )
    : null;
  const kindLabel = a.kind ? t(`articleKinds.${a.kind}`) : null;

  const articleLd = {
    "@context": "https://schema.org",
    "@type":
      a.kind === "study" || a.kind === "whitepaper" ? "ScholarlyArticle" : "Article",
    headline: a.title,
    description: a.excerpt ?? undefined,
    datePublished: a.publishedAt ?? undefined,
    wordCount: words || undefined,
    author: { "@type": "Person", name: "Andrea Eboli" },
    url: pageUrl,
  };

  return (
    <>
      <JsonLd data={articleLd} />
      <DetailHeader
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("libraries.articles.name"), href: "/artigos" },
          { label: a.title },
        ]}
        badge={kindLabel ?? undefined}
        meta={
          <>
            {dateLabel && <span>{dateLabel}</span>}
            {dateLabel && <span className="text-ink/30">·</span>}
            <span>{t("articlePage.readingTime", { minutes })}</span>
          </>
        }
        title={a.title}
        lead={a.excerpt}
      />

      <section className="bg-cream">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
          <article className="min-w-0 max-w-3xl">
            <div className="drop-cap text-[1.06rem]">
              <PortableTextBody value={a.body} />
            </div>

            <EndOrnament
              backHref="/artigos"
              backLabel={t("articlePage.allArticles")}
            />
          </article>

          {/* Sidebar (fixa no desktop; abaixo do texto no mobile) */}
          <aside className="min-w-0 space-y-6 self-start lg:sticky lg:top-24">
            <AuthorCard />

            {toc.length >= 2 && (
              <SideCard label={t("articlePage.toc")}>
                <ul className="space-y-2.5 text-sm">
                  {toc.map((h) => (
                    <li key={h.id}>
                      <a
                        href={`#${h.id}`}
                        className="block border-l-2 border-transparent pl-3 leading-snug text-ink-soft transition-colors hover:border-wine hover:text-green-deep"
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </SideCard>
            )}

            {a.relatedConcepts && a.relatedConcepts.length > 0 && (
              <SideCard label={t("common.relatedConcepts")}>
                <ChipLinks items={a.relatedConcepts} basePath="/conceitos" />
              </SideCard>
            )}

            <div className="space-y-3">
              {a.pdfUrl && (
                <a
                  href={a.pdfUrl}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-green-deep px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-green-soft"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden
                  >
                    <path d="M12 3v12" />
                    <path d="m7 10 5 5 5-5" />
                    <path d="M5 21h14" />
                  </svg>
                  {t("articlePage.downloadPdf")}
                </a>
              )}
              <CopyLinkButton
                url={pageUrl}
                label={t("videoPage.copyLink")}
                copiedLabel={t("videoPage.copied")}
              />
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
