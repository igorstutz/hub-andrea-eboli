import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";
import { sanityFetch } from "@/sanity/lib/fetch";
import { articlesListQuery } from "@/sanity/lib/queries";
import { alternatesFor } from "@/lib/seo";

type ArticleItem = {
  title: string;
  slug: string;
  kind?: string;
  excerpt?: string;
  publishedAt?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "libraries" });
  return {
    title: t("research.name"),
    description: t("research.desc"),
    alternates: alternatesFor("/pesquisas"),
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
  const items = await sanityFetch<ArticleItem[]>(articlesListQuery, { locale });

  return (
    <>
      <PageHeader
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("libraries.research.name") },
        ]}
        title={t("libraries.research.name")}
        lead={t("libraries.research.desc")}
      />
      <section className="bg-cream">
        <div className="mx-auto max-w-5xl px-6 py-16">
          {items.length === 0 ? (
            <p className="text-ink-soft">{t("common.empty")}</p>
          ) : (
            <ul className="divide-y divide-ink/10 border-y border-ink/10">
              {items.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/pesquisas/${a.slug}`}
                    className="group block py-6 transition-colors hover:bg-bone"
                  >
                    <div className="flex items-center gap-3">
                      {a.kind && (
                        <span className="rounded-full bg-green-deep/5 px-3 py-0.5 text-[0.66rem] font-semibold uppercase tracking-wider text-green-soft">
                          {t(`articleKinds.${a.kind}`)}
                        </span>
                      )}
                      {a.publishedAt && (
                        <span className="text-xs text-muted">
                          {new Intl.DateTimeFormat(locale).format(
                            new Date(a.publishedAt),
                          )}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-2 font-serif text-2xl text-green-deep">
                      {a.title}
                    </h2>
                    {a.excerpt && (
                      <p className="mt-1 line-clamp-2 text-sm text-ink-soft">
                        {a.excerpt}
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
