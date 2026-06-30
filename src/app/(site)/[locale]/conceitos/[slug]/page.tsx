import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";
import PortableTextBody from "@/components/PortableTextBody";
import JsonLd from "@/components/JsonLd";
import { sanityFetch } from "@/sanity/lib/fetch";
import { conceptBySlugQuery } from "@/sanity/lib/queries";
import { alternatesFor } from "@/lib/seo";

type Related = { title: string; slug: string };
type CDetail = {
  title: string;
  slug: string;
  shortDefinition?: string;
  fullDefinition?: unknown;
  relatedConcepts?: Related[] | null;
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
      <PageHeader
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("libraries.concepts.name"), href: "/conceitos" },
          { label: c.title },
        ]}
        badge={t("libraries.concepts.badge")}
        title={c.title}
        lead={c.shortDefinition}
      />
      <article className="bg-cream">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <PortableTextBody value={c.fullDefinition} />

          {c.relatedConcepts && c.relatedConcepts.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-4 text-xl text-green-deep">
                {t("common.relatedConcepts")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {c.relatedConcepts.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/conceitos/${r.slug}`}
                    className="rounded-full border border-green-deep/20 px-4 py-1.5 text-sm text-green-deep transition-colors hover:bg-green-deep hover:text-cream"
                  >
                    {r.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
