import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import PageHeader from "@/components/PageHeader";
import PortableTextBody from "@/components/PortableTextBody";
import JsonLd from "@/components/JsonLd";
import { sanityFetch } from "@/sanity/lib/fetch";
import { aboutQuery } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import { alternatesFor, localizedUrl } from "@/lib/seo";

type About = {
  name?: string;
  headline?: string;
  bio?: unknown;
  credentials?: { text?: string }[] | null;
  photo?: unknown;
  sameAs?: string[] | null;
} | null;

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
  const t = await getTranslations();
  const about = await sanityFetch<About>(aboutQuery, { locale });

  const name = about?.name ?? "Andrea Eboli";
  const photoUrl = about?.photo
    ? urlFor(about.photo).width(640).height(640).fit("crop").url()
    : null;

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    description: about?.headline ?? undefined,
    url: localizedUrl(locale, "/sobre"),
    sameAs: about?.sameAs ?? [],
  };

  return (
    <>
      <JsonLd data={personLd} />
      <PageHeader
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("nav.about") },
        ]}
        title={name}
        lead={about?.headline}
      />
      <section className="bg-cream">
        <div className="mx-auto grid max-w-5xl gap-12 px-6 py-16 md:grid-cols-[280px_1fr]">
          <div>
            {photoUrl && (
              <Image
                src={photoUrl}
                alt={name}
                width={280}
                height={280}
                className="rounded-2xl object-cover"
              />
            )}
            {about?.credentials && about.credentials.length > 0 && (
              <ul className="mt-6 space-y-2">
                {about.credentials.map((cr, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-ink-soft"
                  >
                    <span className="h-1 w-1 rounded-full bg-gold" />
                    {cr?.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="max-w-2xl">
            {about?.bio ? (
              <PortableTextBody value={about.bio} />
            ) : (
              <p className="text-ink-soft">{t("common.empty")}</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
