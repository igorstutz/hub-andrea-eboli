import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";
import { sanityFetch } from "@/sanity/lib/fetch";
import { casesListQuery } from "@/sanity/lib/queries";
import { alternatesFor } from "@/lib/seo";

type CaseItem = { title: string; slug: string; description?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "libraries" });
  return {
    title: t("cases.name"),
    description: t("cases.desc"),
    alternates: alternatesFor("/casos"),
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
  const items = await sanityFetch<CaseItem[]>(casesListQuery, { locale });

  return (
    <>
      <PageHeader
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("libraries.cases.name") },
        ]}
        title={t("libraries.cases.name")}
        lead={t("libraries.cases.desc")}
      />
      <section className="bg-cream">
        <div className="mx-auto max-w-5xl px-6 py-16">
          {items.length === 0 ? (
            <p className="text-ink-soft">{t("common.empty")}</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {items.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/casos/${c.slug}`}
                    className="group block h-full rounded-xl border border-ink/10 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[0_30px_70px_-40px_rgba(31,61,47,0.4)]"
                  >
                    <h2 className="font-serif text-xl italic text-green-deep">
                      {c.title}
                    </h2>
                    {c.description && (
                      <p className="mt-2 line-clamp-3 text-sm text-ink-soft">
                        {c.description}
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
