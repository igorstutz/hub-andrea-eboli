import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";
import { sanityFetch } from "@/sanity/lib/fetch";
import { searchQuery } from "@/sanity/lib/queries";
import { alternatesFor } from "@/lib/seo";

type Result = { type: string; title: string; slug: string; excerpt?: string };

const TYPE_TO_PATH: Record<string, string> = {
  question: "/perguntas",
  concept: "/conceitos",
  caseStudy: "/casos",
  article: "/pesquisas",
  video: "/videos",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "search" });
  return {
    title: t("title"),
    alternates: alternatesFor("/busca"),
    robots: { index: false },
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();
  const query = (q ?? "").trim();

  let results: Result[] = [];
  if (query) {
    results = await sanityFetch<Result[]>(searchQuery, {
      locale,
      q: `${query}*`,
    });
  }

  return (
    <>
      <PageHeader
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("search.title") },
        ]}
        title={t("search.title")}
      />
      <section className="bg-cream">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <form className="flex gap-3">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder={t("search.placeholder")}
              className="flex-1 rounded-full border border-ink/15 bg-white px-5 py-3 text-ink outline-none focus:border-green-deep"
            />
            <button
              type="submit"
              className="rounded-full bg-green-deep px-6 py-3 font-medium text-cream transition-colors hover:bg-green-soft"
            >
              {t("search.button")}
            </button>
          </form>

          <div className="mt-10">
            {!query ? (
              <p className="text-ink-soft">{t("search.prompt")}</p>
            ) : results.length === 0 ? (
              <p className="text-ink-soft">
                {t("search.noResults")} “{query}”.
              </p>
            ) : (
              <>
                <p className="mb-6 text-sm text-muted">
                  {t("search.resultsFor")} “{query}”
                </p>
                <ul className="divide-y divide-ink/10 border-y border-ink/10">
                  {results.map((r) => (
                    <li key={`${r.type}-${r.slug}`}>
                      <Link
                        href={`${TYPE_TO_PATH[r.type] ?? "/"}/${r.slug}`}
                        className="block py-5 transition-colors hover:bg-bone"
                      >
                        <h2 className="font-serif text-xl text-green-deep">
                          {r.title}
                        </h2>
                        {r.excerpt && (
                          <p className="mt-1 line-clamp-2 text-sm text-ink-soft">
                            {r.excerpt}
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
