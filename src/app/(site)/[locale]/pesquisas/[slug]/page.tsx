import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import PageHeader from "@/components/PageHeader";
import PortableTextBody from "@/components/PortableTextBody";
import JsonLd from "@/components/JsonLd";
import { sanityFetch } from "@/sanity/lib/fetch";
import { articleBySlugQuery } from "@/sanity/lib/queries";
import { alternatesFor, localizedUrl } from "@/lib/seo";

type ArticleDetail = {
  title: string;
  slug: string;
  kind?: string;
  excerpt?: string;
  body?: unknown;
  publishedAt?: string;
  pdfUrl?: string | null;
  metaTitle?: string;
  metaDescription?: string;
} | null;

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
    alternates: alternatesFor(`/pesquisas/${slug}`),
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

  const articleLd = {
    "@context": "https://schema.org",
    "@type": a.kind === "study" || a.kind === "whitepaper" ? "ScholarlyArticle" : "Article",
    headline: a.title,
    description: a.excerpt ?? undefined,
    datePublished: a.publishedAt ?? undefined,
    author: { "@type": "Person", name: "Andrea Eboli" },
    url: localizedUrl(locale, `/pesquisas/${slug}`),
  };

  return (
    <>
      <JsonLd data={articleLd} />
      <PageHeader
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("libraries.research.name"), href: "/pesquisas" },
          { label: a.title },
        ]}
        badge={a.kind ? t(`articleKinds.${a.kind}`) : undefined}
        title={a.title}
        lead={a.excerpt}
      />
      <article className="bg-cream">
        <div className="mx-auto max-w-3xl px-6 py-14">
          {a.publishedAt && (
            <p className="mb-6 text-sm text-muted">
              {new Intl.DateTimeFormat(locale).format(new Date(a.publishedAt))}
            </p>
          )}

          {a.pdfUrl && (
            <a
              href={a.pdfUrl}
              target="_blank"
              rel="noopener"
              className="mb-8 inline-flex items-center gap-2 rounded-full bg-green-deep px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-green-soft"
            >
              PDF
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
            </a>
          )}

          <PortableTextBody value={a.body} />
        </div>
      </article>
    </>
  );
}
