import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageBanner from "@/components/PageBanner";
import BannerPhoto from "@/components/BannerPhoto";
import JsonLd from "@/components/JsonLd";
import { alternatesFor, localizedUrl } from "@/lib/seo";
import { SOCIAL_SAME_AS } from "@/lib/social";
import { sanityFetch } from "@/sanity/lib/fetch";
import { aboutGalleryQuery } from "@/sanity/lib/queries";
import { urlFor, type ImageSource } from "@/sanity/lib/image";

type GalleryPhoto = {
  key: string;
  alt?: string;
  caption?: string;
  image: ImageSource;
  lqip?: string;
};

// Placeholders da galeria enquanto as fotos não sobem pelo Studio (Sobre Andrea
// → "Galeria de fotos"): blocos nas cores da marca, alternando escuro e areia,
// para a seção parecer intencional em vez de vazia.
const GALLERY_PLACEHOLDERS = [
  { frame: "bg-wine", mesh: "gradient-mesh-wine", mono: "text-cream/15" },
  { frame: "bg-cream-dark", mesh: null, mono: "text-wine/20" },
  { frame: "bg-green-deep", mesh: "gradient-mesh", mono: "text-cream/15" },
  { frame: "bg-wine-soft", mesh: "gradient-mesh-wine", mono: "text-cream/15" },
  { frame: "bg-cream-dark", mesh: null, mono: "text-green-deep/20" },
  { frame: "bg-green-darker", mesh: "gradient-mesh", mono: "text-cream/15" },
] as const;

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
  const experiences = t.raw("experiences") as string[];
  const gallery =
    (await sanityFetch<GalleryPhoto[] | null>(aboutGalleryQuery, { locale })) ??
    [];

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Andrea Eboli",
    description: t("headline"),
    url: localizedUrl(locale, "/sobre"),
    jobTitle: t("role"),
    sameAs: SOCIAL_SAME_AS,
  };

  return (
    <>
      <JsonLd data={personLd} />
      <PageBanner
        crumbs={[
          { label: tc("home"), href: "/" },
          { label: tn("aboutLong") },
        ]}
        badge={t("role")}
        title="Andrea Eboli"
        lead={t("headline")}
      />

      <section className="bg-cream">
        <div className="mx-auto grid max-w-5xl gap-12 px-6 py-20 md:grid-cols-[300px_1fr] md:gap-16">
          {/* Sidebar — retrato + experiências + ações.
              "Reconhecimento" virou "Experiências" a pedido da Andrea
              (19/08/2026): a lista fala do que ela viveu, não de prêmios. */}
          <aside className="md:sticky md:top-[calc(var(--header-h)+2rem)] md:self-start">
            <BannerPhoto />

            <p className="mt-8 kicker text-wine">{t("experiencesLabel")}</p>
            <ul className="mt-4 space-y-2.5">
              {experiences.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm leading-snug text-ink-soft"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-wine" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/"
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

            {/* As TRÊS perguntas — núcleo da investigação (a terceira entrou a
                pedido da Andrea em 19/08/2026) */}
            <div className="my-8 rounded-r-lg border-l-2 border-wine bg-bone px-6 py-6">
              <p className="kicker mb-4 text-wine">{t("questionsLabel")}</p>
              <ol className="space-y-4">
                {[t("q1"), t("q2"), t("q3")].map((q, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="font-serif text-lg font-semibold leading-snug text-wine/45">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="font-serif text-lg italic leading-relaxed text-green-deep">
                      {q}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            <p className="mb-6 leading-relaxed text-ink-soft">{t("p2")}</p>
            <p className="mb-6 leading-relaxed text-ink-soft">{t("p3")}</p>

            {/* Frase de fecho */}
            <blockquote className="mt-12 border-t border-ink/10 pt-10">
              <p className="font-serif text-2xl font-medium leading-snug text-wine md:text-3xl">
                “{t("quote")}”
              </p>
              <cite className="mt-5 block text-sm uppercase not-italic tracking-[0.2em] text-wine">
                Andrea Eboli
              </cite>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Galeria — as fotos entram pelo Studio (Sobre Andrea → Galeria de fotos) */}
      <section className="border-t border-ink/10 bg-bone">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="kicker text-wine">{t("galleryLabel")}</p>
              <h2 className="mt-3 text-3xl text-green-deep md:text-4xl">
                {t("galleryTitle")}
              </h2>
            </div>
            {gallery.length === 0 && (
              <p className="max-w-xs font-serif text-lg italic text-muted">
                {t("gallerySoon")}
              </p>
            )}
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
            {gallery.length > 0
              ? gallery.map((g) => (
                  <figure key={g.key} className="group">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-green-darker">
                      <Image
                        src={urlFor(g.image)
                          .width(900)
                          .height(1200)
                          .fit("crop")
                          .auto("format")
                          .url()}
                        alt={g.alt ?? "Andrea Eboli"}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        {...(g.lqip
                          ? { placeholder: "blur" as const, blurDataURL: g.lqip }
                          : {})}
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    </div>
                    {g.caption && (
                      <figcaption className="mt-3 text-sm leading-snug text-muted">
                        {g.caption}
                      </figcaption>
                    )}
                  </figure>
                ))
              : GALLERY_PLACEHOLDERS.map((p, i) => (
                  <div
                    key={i}
                    aria-hidden
                    className={`relative aspect-[3/4] overflow-hidden rounded-lg ${p.frame}`}
                  >
                    {p.mesh && (
                      <div
                        className={`${p.mesh} pointer-events-none absolute inset-0 opacity-40`}
                      />
                    )}
                    <span
                      className={`wordmark absolute inset-0 flex items-center justify-center text-5xl ${p.mono}`}
                    >
                      AE
                    </span>
                  </div>
                ))}
          </div>
        </div>
      </section>
    </>
  );
}
