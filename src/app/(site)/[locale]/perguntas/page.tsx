import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";
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
            <ul className="grid gap-4 sm:grid-cols-2">
              {items.map((q) => (
                <li key={q.slug}>
                  <Link
                    href={`/perguntas/${q.slug}`}
                    className="group block h-full rounded-xl border border-ink/10 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[0_30px_70px_-40px_rgba(31,61,47,0.4)]"
                  >
                    {q.topic?.title && (
                      <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-wine">
                        {q.topic.title}
                      </span>
                    )}
                    <h2 className="mt-1 font-serif text-xl text-green-deep">
                      {q.title}
                    </h2>
                    {q.answer && (
                      <p className="mt-2 line-clamp-2 text-sm text-ink-soft">
                        {q.answer}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
