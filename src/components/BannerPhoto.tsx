import Image from "next/image";
import { asset } from "@/lib/assetPath";

// Foto editorial do banner — moldura RETANGULAR (o arco saiu a pedido da Andrea
// em 19/08/2026) + bloco de cor deslocado atrás, mantendo a colagem editorial +
// leve tratamento de cor da marca por cima.
//
// Foto da Andrea já enquadrada em 3:4 e cortada acima do cós da calça. No
// projeto fica só a versão leve (.webp); o PNG original está FORA do repositório,
// na pasta irmã `brand-originais/`. Se PHOTO_SRC for null, cai no placeholder
// desenhado (monograma).
const PHOTO_SRC: string | null = "/brand/andrea-banner.webp";

export default function BannerPhoto({
  priority = false,
  className = "",
}: {
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative mx-auto w-full max-w-[22rem] ${className}`}>
      {/* bloco de cor deslocado atrás da foto (colagem editorial) */}
      <div
        aria-hidden
        className="absolute -left-5 -top-5 h-full w-full rounded-[4px] border border-cream/15 bg-wine/45"
      />

      <div className="photo-frame photo-duotone relative aspect-[3/4] w-full bg-green-darker">
        {PHOTO_SRC ? (
          <Image
            src={asset(PHOTO_SRC)}
            alt="Andrea Eboli"
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
