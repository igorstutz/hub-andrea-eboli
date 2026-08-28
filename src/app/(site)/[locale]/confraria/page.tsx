import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageBanner from "@/components/PageBanner";
import EvidenceIntro from "@/components/EvidenceIntro";
import Reveal from "@/components/Reveal";
import { alternatesFor } from "@/lib/seo";
import { asset } from "@/lib/assetPath";

/* ------------------------------------------------------------------
   MATERIAL DA CONFRARIA — preencher quando as fotos chegarem.

   PHOTOS  → 1 foto principal (uma conversa real) + 2 menores mostrando
             interação, cartões e dinâmica. Arquivos em public/confraria/.
   TESTIMONIAL → depoimento curto ou aprendizado de participante.
   CONFRARIA_URL → destino do botão "Conheça a Confraria". Enquanto for null
             o botão não aparece.
------------------------------------------------------------------- */
const PHOTOS: { src: string; altKey: string }[] = [
  { src: "/confraria/confraria-conversa.webp", altKey: "photoConversaAlt" },
  { src: "/confraria/confraria-grupo.webp", altKey: "photoGrupoAlt" },
  { src: "/confraria/confraria-encontro.webp", altKey: "photoEncontroAlt" },
];
const TESTIMONIAL: { quote: string; author: string } | null = null;
const CONFRARIA_URL: string | null = null;

// Placeholders nas cores da marca enquanto as fotos não chegam — a seção
// parece intencional em vez de vazia (mesmo padrão da galeria do /sobre).
const PHOTO_PLACEHOLDERS = [
  { frame: "bg-wine", mesh: "gradient-mesh-wine", mono: "text-cream/15" },
  { frame: "bg-green-deep", mesh: "gradient-mesh", mono: "text-cream/15" },
  { frame: "bg-cream-dark", mesh: null, mono: "text-wine/20" },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "confrariaPage" });
  return {
    title: t("title"),
    description: t("headline"),
    alternates: alternatesFor("/confraria"),
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("confrariaPage");
  const tc = await getTranslations("common");
  const tn = await getTranslations("nav");

  const main = PHOTOS[0];
  const secondary = PHOTOS.slice(1, 3);

  return (
    <>
      <PageBanner
        crumbs={[{ label: tc("home"), href: "/" }, { label: tn("confraria") }]}
        badge={t("badge")}
        title={t("title")}
        lead={t("headline")}
      />

      <EvidenceIntro />

      {/* A Confraria em imagens: 1 foto principal + 2 menores */}
      <section className="border-t border-ink/10 bg-bone">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 className="text-3xl text-green-deep md:text-4xl">
                {t("photosLabel")}
              </h2>
              {PHOTOS.length === 0 && (
                <p className="max-w-xs font-serif text-lg italic text-muted">
                  {t("soon")}
                </p>
              )}
            </div>
          </Reveal>

          {/* A foto principal ocupa as duas fileiras da direita, para as três
              terminarem na mesma linha de base. */}
          <div className="mt-10 grid gap-5 md:grid-cols-[1.6fr_1fr] md:grid-rows-2">
            {/* Foto principal */}
            <Reveal className="md:row-span-2 md:h-full">
              {main ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-green-darker md:aspect-auto md:h-full">
                  <Image
                    src={asset(main.src)}
                    alt={t(main.altKey)}
                    fill
                    sizes="(max-width: 768px) 100vw, 60vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div
                  aria-hidden
                  className={`relative aspect-[4/3] overflow-hidden rounded-2xl md:aspect-auto md:h-full ${PHOTO_PLACEHOLDERS[0].frame}`}
                >
                  <div
                    className={`${PHOTO_PLACEHOLDERS[0].mesh} pointer-events-none absolute inset-0 opacity-40`}
                  />
                  <span className="wordmark absolute inset-0 flex items-center justify-center text-6xl text-cream/15">
                    AE
                  </span>
                </div>
              )}
            </Reveal>

            {/* Duas fotos menores */}
            <div className="grid gap-5 md:row-span-2 md:grid-rows-2">
              {[0, 1].map((i) => {
                const photo = secondary[i];
                const ph = PHOTO_PLACEHOLDERS[i + 1];
                return (
                  <Reveal key={i} delay={(i + 1) * 110}>
                    {photo ? (
                      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-green-darker">
                        <Image
                          src={asset(photo.src)}
                          alt={t(photo.altKey)}
                          fill
                          sizes="(max-width: 768px) 100vw, 35vw"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        aria-hidden
                        className={`relative aspect-[4/3] overflow-hidden rounded-2xl ${ph.frame}`}
                      >
                        {ph.mesh && (
                          <div
                            className={`${ph.mesh} pointer-events-none absolute inset-0 opacity-40`}
                          />
                        )}
                        <span
                          className={`wordmark absolute inset-0 flex items-center justify-center text-4xl ${ph.mono}`}
                        >
                          AE
                        </span>
                      </div>
                    )}
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Depoimento de participante */}
      {TESTIMONIAL && (
        <section className="relative overflow-hidden bg-green-deep text-cream">
          <div className="gradient-mesh pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative mx-auto max-w-3xl px-6 py-20 text-center">
            <Reveal>
              <p className="kicker text-cream/50">{t("testimonialLabel")}</p>
              <span className="mt-6 block font-serif text-6xl leading-none text-cream/25">
                “
              </span>
              <blockquote className="-mt-4 font-serif text-2xl italic leading-snug md:text-3xl">
                {TESTIMONIAL.quote}
              </blockquote>
              <cite className="mt-7 block text-sm uppercase not-italic tracking-[0.2em] text-cream/70">
                {TESTIMONIAL.author}
              </cite>
            </Reveal>
          </div>
        </section>
      )}

      {/* CTA da Confraria */}
      {CONFRARIA_URL && (
        <section className="bg-cream">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center">
            <Reveal>
              <a
                href={CONFRARIA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full bg-wine px-7 py-3.5 text-sm font-semibold text-cream transition-all hover:gap-3 hover:bg-wine-deep"
              >
                {t("cta")}
                <span className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </a>
            </Reveal>
          </div>
        </section>
      )}

      {/* Ponte para a Pesquisa — a outra metade do par */}
      <section className="relative overflow-hidden bg-wine text-cream">
        <div className="blob animate-float absolute -right-16 -top-16 h-72 w-72 bg-cream/15" />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center">
          <Reveal>
            <h2 className="text-3xl italic md:text-4xl">{t("crossTitle")}</h2>
            <p className="mx-auto mt-4 max-w-xl text-cream/85">
              {t("crossBody")}
            </p>
            <Link
              href="/pesquisa"
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-cream px-7 py-3.5 text-sm font-semibold text-wine transition-all hover:gap-3 hover:bg-white"
            >
              {t("crossCta")}
              <span className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
