import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageBanner from "@/components/PageBanner";
import EvidenceIntro from "@/components/EvidenceIntro";
import Reveal from "@/components/Reveal";
import { pageMetadata } from "@/lib/seo";
import { asset } from "@/lib/assetPath";

/* ------------------------------------------------------------------
   MATERIAL DA CONFRARIA

   PHOTOS  → a primeira é o destaque (largura inteira); as demais formam a
             galeria em mosaico, cada uma na sua proporção original.
             Arquivos em public/confraria/, gerados por
             `prepara-fotos-confraria.mjs`; os alts moram no i18n.
   TESTIMONIAL → depoimento curto ou aprendizado de participante.
   CONFRARIA_URL → destino do botão "Conheça a Confraria". Enquanto for null
             o botão não aparece.
------------------------------------------------------------------- */
type Photo = { src: string; altKey: string; w: number; h: number };

const PHOTOS: Photo[] = [
  {
    src: "/confraria/andrea-eboli-confraria-lets-be-roda-de-conversa.webp",
    altKey: "photoRodaConversaAlt",
    w: 1600,
    h: 1066,
  },
  {
    src: "/confraria/confraria-lets-be-foto-oficial-do-grupo.webp",
    altKey: "photoGrupoOficialAlt",
    w: 1600,
    h: 1066,
  },
  {
    src: "/confraria/confraria-lets-be-brinde-camisetas-na-cesta-de-palha.webp",
    altKey: "photoCestaBrindeAlt",
    w: 1066,
    h: 1600,
  },
  {
    src: "/confraria/andrea-eboli-confraria-lets-be-conduzindo-conversa.webp",
    altKey: "photoConduzindoAlt",
    w: 1066,
    h: 1600,
  },
  {
    src: "/confraria/confraria-lets-be-jantar-do-encontro.webp",
    altKey: "photoJantarAlt",
    w: 1200,
    h: 1600,
  },
  {
    src: "/confraria/confraria-lets-be-participantes-camisetas-better-humans.webp",
    altKey: "photoCamisetasGrupoAlt",
    w: 1600,
    h: 1200,
  },
  {
    src: "/confraria/andrea-eboli-confraria-lets-be-com-participante.webp",
    altKey: "photoDuplaAlt",
    w: 1066,
    h: 1600,
  },
  {
    src: "/confraria/confraria-lets-be-selfie-participantes-jantar.webp",
    altKey: "photoSelfieAlt",
    w: 1600,
    h: 1200,
  },
  {
    src: "/confraria/confraria-lets-be-mesa-de-conversa-noturna.webp",
    altKey: "photoMesaAlt",
    w: 1200,
    h: 1600,
  },
  {
    src: "/confraria/confraria-lets-be-grupo-reunido-no-salao-do-encontro.webp",
    altKey: "photoGrupoSalaoAlt",
    w: 1200,
    h: 1600,
  },
  {
    src: "/confraria/andrea-eboli-confraria-lets-be-abraco-participante.webp",
    altKey: "photoAbracoAlt",
    w: 1066,
    h: 1600,
  },
  {
    src: "/confraria/confraria-lets-be-dupla-de-participantes-no-painel-de-arvores.webp",
    altKey: "photoDuplaPainelAlt",
    w: 960,
    h: 1280,
  },
  {
    src: "/confraria/confraria-lets-be-grupo-participantes-encontro.webp",
    altKey: "photoGrupoAlt",
    w: 1600,
    h: 1066,
  },
  {
    src: "/confraria/confraria-lets-be-participantes-tirando-selfie.webp",
    altKey: "photoSelfieDuplaAlt",
    w: 1200,
    h: 1600,
  },
  {
    src: "/confraria/confraria-lets-be-participantes-sacolas-lets-be-real.webp",
    altKey: "photoSacolasAlt",
    w: 1200,
    h: 1600,
  },
  {
    src: "/confraria/confraria-lets-be-camisetas-lets-be-better-humans.webp",
    altKey: "photoCamisetasAlt",
    w: 1200,
    h: 1600,
  },
];
const TESTIMONIAL: { quote: string; author: string } | null = null;
const CONFRARIA_URL: string | null = null;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "confrariaPage" });
  return pageMetadata({
    title: t("title"),
    description: t("headline"),
    path: "/confraria",
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
  const t = await getTranslations("confrariaPage");
  const tc = await getTranslations("common");
  const tn = await getTranslations("nav");

  const [main, ...gallery] = PHOTOS;

  return (
    <>
      <PageBanner
        crumbs={[{ label: tc("home"), href: "/" }, { label: tn("confraria") }]}
        badge={t("badge")}
        title={t("title")}
        lead={t("headline")}
      />

      <EvidenceIntro />

      {/* A Confraria em imagens: foto de destaque + mosaico */}
      <section className="border-t border-ink/10 bg-bone">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Reveal>
            <h2 className="text-3xl text-green-deep md:text-4xl">
              {t("photosLabel")}
            </h2>
          </Reveal>

          {/* Destaque em largura inteira, na proporção original da foto */}
          <Reveal className="mt-10">
            <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-green-darker">
              <Image
                src={asset(main.src)}
                alt={t(main.altKey)}
                fill
                sizes="(max-width: 1152px) 100vw, 1152px"
                className="object-cover"
              />
            </div>
          </Reveal>

          {/* Mosaico: colunas de altura livre, cada foto na proporção em que
              foi tirada (nada de recorte em gente). */}
          <div className="mt-5 gap-5 sm:columns-2 lg:columns-3 [column-gap:1.25rem]">
            {gallery.map((photo, i) => (
              <Reveal
                key={photo.src}
                delay={(i % 3) * 110}
                className="mb-5 break-inside-avoid"
              >
                <div className="group overflow-hidden rounded-2xl bg-green-darker">
                  <Image
                    src={asset(photo.src)}
                    alt={t(photo.altKey)}
                    width={photo.w}
                    height={photo.h}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="w-full transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
              </Reveal>
            ))}
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
