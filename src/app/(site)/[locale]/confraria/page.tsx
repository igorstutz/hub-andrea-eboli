import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageBanner from "@/components/PageBanner";
import EvidenceIntro from "@/components/EvidenceIntro";
import Reveal from "@/components/Reveal";
import { pageMetadata } from "@/lib/seo";
import { asset } from "@/lib/assetPath";
import { getPageText } from "@/lib/pageText";
import { sanityFetch } from "@/sanity/lib/fetch";
import { pagePhotosQuery } from "@/sanity/lib/queries";
import { urlFor, type ImageSource } from "@/sanity/lib/image";

/* ------------------------------------------------------------------
   MATERIAL DA CONFRARIA

   Desde 25/09/2026 tudo aqui é editável no painel (Confraria Let's Be):
   textos, fotos (com descrição), depoimento e o link do botão. O depoimento
   e o botão só aparecem quando preenchidos.

   PHOTOS  → a RESERVA para quando o painel não tiver fotos: a primeira é o
             destaque (largura inteira); as demais formam a galeria em
             mosaico, cada uma na sua proporção original. Arquivos em
             public/confraria/, gerados por `prepara-fotos-confraria.mjs`
             (que guarda o porquê da curadoria); os alts moram no i18n.
             As mesmas 10 fotos foram levadas ao painel pelo
             `semeia-textos-paginas.mjs`.
------------------------------------------------------------------- */
type Photo = { src: string; altKey: string; w: number; h: number };

/** Uma foto como a página desenha, venha do painel ou da reserva. */
type Shown = { key: string; src: string; alt: string; w: number; h: number };

type PanelPhoto = {
  key: string;
  alt?: string;
  image: ImageSource;
  w?: number;
  h?: number;
};

/* 10 fotos (eram 16 até 31/08/2026). Saíram 6 a pedido da Andrea: cada uma
   repetia o mesmo instante ou a mesma cena de outra que ficou, e duas ainda
   tinham enquadramento ruim (ar-condicionado ocupando o terço de cima; rosto
   desfocado tomando um terço do quadro). O porquê de cada corte, com o par
   correspondente, está em `prepara-fotos-confraria.mjs`.

   A ORDEM separa cenas parecidas. O que importa aqui: sobraram DUAS fotos
   feitas diante do painel de árvores, e elas estão nas posições 2 e 7 da
   galeria. Não é arbitrário: o mosaico é `columns`, que distribui os itens em
   sequência pelas 3 colunas, então com 9 fotos a coluna 1 fica com 1-3, a 2
   com 4-6 e a 3 com 7-9. As posições 2 e 7 caem em colunas E alturas
   diferentes. Antes as três estavam em 2, 6 e 10 e apareciam lado a lado, na
   mesma linha, parecendo a mesma foto três vezes. */
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
    src: "/confraria/andrea-eboli-confraria-lets-be-abraco-participante.webp",
    altKey: "photoAbracoAlt",
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
    src: "/confraria/andrea-eboli-confraria-lets-be-conduzindo-conversa.webp",
    altKey: "photoConduzindoAlt",
    w: 1066,
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
    src: "/confraria/confraria-lets-be-dupla-de-participantes-no-painel-de-arvores.webp",
    altKey: "photoDuplaPainelAlt",
    w: 960,
    h: 1280,
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { tx: t } = await getPageText("confrariaPage", "confrariaPage", locale);
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
  const [{ tx: t, url }, panelPhotos] = await Promise.all([
    getPageText("confrariaPage", "confrariaPage", locale),
    sanityFetch<PanelPhoto[] | null>(pagePhotosQuery, {
      id: "confrariaPage",
      field: "photos",
      locale,
    }),
  ]);
  const tc = await getTranslations("common");
  const tn = await getTranslations("nav");

  const photos: Shown[] = panelPhotos?.length
    ? panelPhotos.map((p) => ({
        key: p.key,
        src: urlFor(p.image).width(1600).auto("format").url(),
        alt: p.alt || t("photosLabel"),
        w: p.w ?? 1600,
        h: p.h ?? 1066,
      }))
    : PHOTOS.map((p) => ({ key: p.src, src: asset(p.src), alt: t(p.altKey), w: p.w, h: p.h }));
  const [main, ...gallery] = photos;

  const quote = t("testimonialQuote", "");
  const testimonial = quote ? { quote, author: t("testimonialAuthor", "") } : null;
  const confrariaUrl = url("confrariaUrl");

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
                src={main.src}
                alt={main.alt}
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
                key={photo.key}
                delay={(i % 3) * 110}
                className="mb-5 break-inside-avoid"
              >
                <div className="group overflow-hidden rounded-2xl bg-green-darker">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
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
      {testimonial && (
        <section className="relative overflow-hidden bg-green-deep text-cream">
          <div className="gradient-mesh pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative mx-auto max-w-3xl px-6 py-20 text-center">
            <Reveal>
              <p className="kicker text-cream/50">{t("testimonialLabel")}</p>
              <span className="mt-6 block font-serif text-6xl leading-none text-cream/25">
                “
              </span>
              <blockquote className="-mt-4 font-serif text-2xl italic leading-snug md:text-3xl">
                {testimonial.quote}
              </blockquote>
              <cite className="mt-7 block text-sm uppercase not-italic tracking-[0.2em] text-cream/70">
                {testimonial.author}
              </cite>
            </Reveal>
          </div>
        </section>
      )}

      {/* CTA da Confraria */}
      {confrariaUrl && (
        <section className="bg-cream">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center">
            <Reveal>
              <a
                href={confrariaUrl}
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
