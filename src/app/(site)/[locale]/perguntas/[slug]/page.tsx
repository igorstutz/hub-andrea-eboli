import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";
import PortableTextBody from "@/components/PortableTextBody";
import JsonLd from "@/components/JsonLd";
import { sanityFetch } from "@/sanity/lib/fetch";
import { questionBySlugQuery } from "@/sanity/lib/queries";
import { alternatesFor, localizedUrl } from "@/lib/seo";

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
      { "@type": "ListItem", position: 3, name: q.title, item: localizedUrl(locale, `/perguntas/${slug}`) },
    ],
  };

  return (
    <>
      <JsonLd data={faqLd} />
      <JsonLd data={breadcrumbLd} />
      <PageHeader
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("libraries.questions.name"), href: "/perguntas" },
          { label: q.title },
        ]}
        badge={q.topic?.title}
        title={q.title}
        lead={q.experience}
      />
      <article className="bg-cream">
        <div className="mx-auto max-w-3xl px-6 py-14">
          {q.answer && (
            <div className="mb-8 rounded-r border-l-[3px] border-gold bg-bone p-5">
              <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wider text-wine">
                {t("common.directAnswer")}
              </p>
              <p className="text-lg text-ink">{q.answer}</p>
            </div>
          )}

          <PortableTextBody value={q.body} />

          {q.relatedConcepts && q.relatedConcepts.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-4 text-xl text-green-deep">
                {t("common.relatedConcepts")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {q.relatedConcepts.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/conceitos/${c.slug}`}
                    className="rounded-full border border-green-deep/20 px-4 py-1.5 text-sm text-green-deep transition-colors hover:bg-green-deep hover:text-cream"
                  >
                    {c.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {q.relatedQuestions && q.relatedQuestions.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-4 text-xl text-green-deep">
                {t("common.relatedQuestions")}
              </h2>
              <ul className="space-y-2">
                {q.relatedQuestions.map((r) => (
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
