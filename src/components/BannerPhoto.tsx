import Image from "next/image";

// Foto integrada do banner — uso "não orgânico" (estilo Esther Perel):
// moldura em arco + bloco de cor deslocado atrás (colagem editorial) +
// leve tratamento de cor da marca por cima.
//
// Enquanto a foto real não existe, mostra um placeholder desenhado (monograma
// + tríade) que já parece intencional. Para ativar a foto de verdade:
// coloque o arquivo em  public/brand/andrea-banner.jpg  e troque a constante
// abaixo por  "/brand/andrea-banner.jpg"  (o next/image aplica o basePath).
const PHOTO_SRC: string | null = null;

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
        className="absolute -left-5 -top-5 h-full w-full rounded-t-[999px] border border-cream/15 bg-wine/45"
      />

      <div className="photo-arch photo-duotone relative aspect-[3/4] w-full bg-green-darker">
        {PHOTO_SRC ? (
          <Image
            src={PHOTO_SRC}
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
            <span className="kicker text-cream/40">
              Percepção · Escolha · Presença
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
