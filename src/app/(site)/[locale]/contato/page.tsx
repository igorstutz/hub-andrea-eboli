import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import PageBanner from "@/components/PageBanner";
import NewsletterForm from "@/components/NewsletterForm";
import { alternatesFor } from "@/lib/seo";
import { INSTAGRAM_URL } from "@/lib/social";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return {
    title: t("contact"),
    alternates: alternatesFor("/contato"),
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contactPage");
  const tc = await getTranslations("common");
  const tn = await getTranslations("nav");
  const email = t("email");

  return (
    <>
      <PageBanner
        crumbs={[{ label: tc("home"), href: "/" }, { label: tn("contact") }]}
        badge={t("badge")}
        title={t("headline")}
        lead={t("lead")}
      />

      <section className="bg-cream">
        <div className="mx-auto grid max-w-5xl gap-14 px-6 py-20 md:grid-cols-2 md:py-24">
          {/* Canais diretos */}
          <div>
            <p className="kicker text-wine">{t("emailLabel")}</p>
            <a
              href={`mailto:${email}`}
              className="group mt-3 inline-flex items-center gap-2 font-serif text-2xl italic text-green-deep transition-colors hover:text-wine md:text-3xl"
            >
              {email}
              <span className="text-wine transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </a>

            <p className="kicker mt-10 text-wine">{t("socialLabel")}</p>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-ink-soft transition-colors hover:text-wine"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-wine" />
                  Instagram · @souandreaeboli
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="rounded-2xl border border-ink/10 bg-bone p-8">
            <h2 className="text-2xl text-green-deep md:text-3xl">
              {t("newsletterTitle")}
            </h2>
            <div className="mt-6">
              <NewsletterForm tone="light" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
