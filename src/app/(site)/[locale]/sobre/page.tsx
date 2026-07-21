import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageBanner from "@/components/PageBanner";
import BannerPhoto from "@/components/BannerPhoto";
import JsonLd from "@/components/JsonLd";
import { alternatesFor, localizedUrl } from "@/lib/seo";

const INSTAGRAM = "https://www.instagram.com/souandreaeboli";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return {
    title: t("about"),
    alternates: alternatesFor("/sobre"),
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("aboutPage");
  const tc = await getTranslations("common");
  const tn = await getTranslations("nav");
  const th = await getTranslations("home");
  const credentials = th.raw("credentials") as string[];

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Andrea Eboli",
    description: t("headline"),
    url: localizedUrl(locale, "/sobre"),
    jobTitle: t("role"),
    sameAs: [INSTAGRAM],
  };

  return (
    <>
      <JsonLd data={personLd} />
      <PageBanner
        crumbs={[
          { label: tc("home"), href: "/" },
          { label: tn("about") },
        ]}
        badge={t("role")}
        title="Andrea Eboli"
        lead={t("headline")}
      />

      <section className="bg-cream">
        <div className="mx-auto grid max-w-5xl gap-12 px-6 py-20 md:grid-cols-[300px_1fr] md:gap-16">
          {/* Sidebar — retrato + reconhecimento + ações */}
          <aside className="md:sticky md:top-[calc(var(--header-h)+2rem)] md:self-start">
            <BannerPhoto />

            <p className="mt-8 kicker text-wine">{t("credentialsLabel")}</p>
            <ul className="mt-4 space-y-2.5">
              {credentials.map((cr, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2.5 text-sm text-ink-soft"
                >
                  <span className="h-1 w-1 shrink-0 rounded-full bg-wine" />
                  {cr}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/ser-poder"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-green-deep px-5 py-3 text-sm font-semibold text-cream transition-all hover:gap-3 hover:bg-green-darker"
              >
                {t("methodCta")}
                <span className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
              <Link
                href="/contato"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-wine/30 px-5 py-3 text-sm font-medium text-wine transition-colors hover:bg-wine hover:text-cream"
              >
                {t("contactCta")}
              </Link>
            </div>
          </aside>

          {/* Bio — long-form editorial */}
          <div className="max-w-2xl">
            <div className="drop-cap">
              <p className="mb-6 text-xl leading-relaxed text-ink">{t("p1")}</p>
            </div>

            {/* As duas perguntas — núcleo da investigação */}
            <div className="my-8 rounded-r-lg border-l-2 border-wine bg-bone px-6 py-6">
              <p className="kicker mb-3 text-wine">{tn("about")}</p>
              <p className="font-serif text-xl italic leading-relaxed text-green-deep">
                {t("p2")}
              </p>
            </div>

            <p className="mb-6 leading-relaxed text-ink-soft">{t("p3")}</p>
            <p className="mb-6 leading-relaxed text-ink-soft">{t("p4")}</p>

            {/* Frase de fecho */}
            <blockquote className="mt-12 border-t border-ink/10 pt-10">
              <p className="font-serif text-2xl font-medium leading-snug text-green-deep md:text-3xl">
                “{t("quote")}”
              </p>
              <cite className="mt-5 block text-sm uppercase not-italic tracking-[0.2em] text-wine">
                Andrea Eboli
              </cite>
            </blockquote>
          </div>
        </div>
      </section>
    </>
  );
}
