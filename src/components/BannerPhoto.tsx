import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { asset } from "@/lib/assetPath";
import { sanityFetch } from "@/sanity/lib/fetch";
import { pageImageQuery } from "@/sanity/lib/queries";
import { urlFor, type ImageSource } from "@/sanity/lib/image";

// Foto editorial do banner — moldura RETANGULAR (o arco saiu a pedido da Andrea
// em 19/08/2026) + bloco de cor deslocado atrás, mantendo a colagem editorial +
// leve tratamento de cor da marca por cima.
//
// Retrato de 2026 (trocado em 20/08/2026), recortado em 3:4 a partir do
// original 1154x1731: enquadramento fechado no rosto e no torso, com as mãos
// inteiras. No projeto fica só a versão leve (.webp, 900x1200); o JPG original
// está FORA do repositório, na pasta irmã `brand-originais/`. Se PHOTO_SRC for
// null, cai no placeholder desenhado (monograma).
//
// Desde 25/09/2026 o retrato é trocável no painel (Sobre Andrea → Coluna
// lateral → Retrato). Vazio lá = este arquivo. O recorte 3:4 respeita o ponto
// de foco que ela marcar na foto.
const PHOTO_SRC: string | null = "/brand/andrea-eboli-retrato-2026.webp";

export default async function BannerPhoto({
  priority = false,
  className = "",
}: {
  priority?: boolean;
  className?: string;
}) {
  // O alt vem do i18n (`common.portraitAlt`) para acompanhar o idioma da página.
  const t = await getTranslations("common");
  const fromPanel = await sanityFetch<{ image: ImageSource; lqip?: string } | null>(
    pageImageQuery,
    { id: "aboutPage", field: "photo" },
  );
  const src = fromPanel?.image
    ? urlFor(fromPanel.image).width(900).height(1200).fit("crop").auto("format").url()
    : PHOTO_SRC && asset(PHOTO_SRC);

  return (
    <div className={`relative mx-auto w-full max-w-[22rem] ${className}`}>
      {/* bloco de cor deslocado atrás da foto (colagem editorial) */}
      <div
        aria-hidden
        className="absolute -left-5 -top-5 h-full w-full rounded-[4px] border border-cream/15 bg-wine/45"
      />

      <div className="photo-frame photo-duotone relative aspect-[3/4] w-full bg-green-darker">
        {src ? (
          <Image
            src={src}
            alt={t("portraitAlt")}
            fill
            priority={priority}
            sizes="(max-width: 1024px) 80vw, 22rem"
            className="object-cover"
          />
        ) : (
          /* Placeholder desenhado — some assim que a foto real entrar */
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center text-cream/70">
            <span className="wordmark text-7xl text-cream/25">AE</span>
          </div>
        )}
      </div>
    </div>
  );
}
