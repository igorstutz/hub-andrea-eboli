import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";
import PortableTextBody from "@/components/PortableTextBody";
import JsonLd from "@/components/JsonLd";
import { sanityFetch } from "@/sanity/lib/fetch";
import { caseBySlugQuery } from "@/sanity/lib/queries";
import { alternatesFor, localizedUrl } from "@/lib/seo";

type Related = { title: string; slug: string };
type CaseDetail = {
  title: string;
  slug: string;
  description?: string;
  pattern?: unknown;
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
  return {
    title: c.metaTitle || c.title,
    description: c.metaDescription || c.description,
    alternates: alternatesFor(`/casos/${slug}`),
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
  const c = await sanityFetch<CaseDetail>(caseBySlugQuery, { locale, slug });
  if (!c) notFound();

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("common.home"), item: localizedUrl(locale, "/") },
      { "@type": "ListItem", position: 2, name: t("libraries.cases.name"), item: localizedUrl(locale, "/casos") },
      { "@type": "ListItem", position: 3, name: c.title, item: localizedUrl(locale, `/casos/${slug}`) },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbLd} />
      <PageHeader
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("libraries.cases.name"), href: "/casos" },
          { label: c.title },
        ]}
        badge={t("libraries.cases.badge")}
        title={c.title}
        lead={c.description}
      />
      <article className="bg-cream">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <PortableTextBody value={c.pattern} />

          {c.relatedQuestions && c.relatedQuestions.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-4 text-xl text-green-deep">
                {t("common.relatedQuestions")}
              </h2>
              <ul className="space-y-2">
                {c.relatedQuestions.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={`/perguntas/${r.slug}`}
                      className="text-wine hover:underline"
                    >
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
