import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import PageBanner from "@/components/PageBanner";
import NewsletterForm from "@/components/NewsletterForm";
import { pageMetadata } from "@/lib/seo";
import { getPageText, getNewsletterLabels } from "@/lib/pageText";
import { SOCIAL_LINKS } from "@/lib/social";
import SocialIcon from "@/components/SocialIcon";

// As redes listadas no Contato, nesta ordem (as que existirem em social.ts).
const CONTACT_NETWORKS = ["instagram", "youtube", "linkedin", "tiktok"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const { tx: tp } = await getPageText("contactPage", "contactPage", locale);
  return pageMetadata({
    title: t("contact"),
    description: tp("headline"),
    path: "/contato",
    locale,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [{ tx: t }, newsletter] = await Promise.all([
    getPageText("contactPage", "contactPage", locale),
    getNewsletterLabels(locale),
  ]);
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
            </a>
            <div>
              <a
                href={`mailto:${email}`}
                className="group mt-5 inline-flex items-center gap-2 rounded-full bg-wine px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-wine-soft"
              >
                {t("emailCta")}
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </a>
            </div>

            <p className="kicker mt-10 text-wine">{t("socialLabel")}</p>
            <ul className="mt-4 space-y-3">
              {CONTACT_NETWORKS.map((id) => SOCIAL_LINKS.find((s) => s.id === id))
                .filter((s) => s !== undefined)
                .map((s) => (
                  <li key={s.id}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 text-ink-soft transition-colors hover:text-wine"
                    >
                      <SocialIcon name={s.id} className="h-5 w-5 text-wine" />
                      {s.handle ? `${s.name} · ${s.handle}` : s.name}
                    </a>
                  </li>
                ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="rounded-2xl border border-ink/10 bg-bone p-8">
            <h2 className="text-2xl text-green-deep md:text-3xl">
              {t("newsletterTitle")}
            </h2>
            <div className="mt-6">
              <NewsletterForm tone="light" labels={newsletter} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
