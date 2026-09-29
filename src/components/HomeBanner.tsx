import { getLocale } from "next-intl/server";
import { getPageText } from "@/lib/pageText";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/Reveal";
import RotatingQuestions from "@/components/RotatingQuestions";
import BannerPhoto from "@/components/BannerPhoto";
import { HERO_COLORS, type HeroColor } from "@/sanity/pageTextDefs";

// A cor do fundo vem do painel (Página inicial → Topo → Cor do fundo do topo).
// Classes escritas por inteiro: o Tailwind só gera o que aparece literal.
// `photo` = o bloco de cor deslocado atrás da foto.
const HERO_THEME: Record<HeroColor, { bg: string; mesh: string; blob: string; photo: string }> = {
  wine: { bg: "bg-wine", mesh: "gradient-mesh-wine", blob: "bg-wine-soft/35", photo: "bg-wine/45" },
  wineDeep: { bg: "bg-wine-deep", mesh: "gradient-mesh-wine", blob: "bg-wine-soft/30", photo: "bg-wine-soft/40" },
  green: { bg: "bg-green-deep", mesh: "gradient-mesh-green", blob: "bg-green-soft/40", photo: "bg-green-soft/50" },
  greenSoft: { bg: "bg-green-soft", mesh: "gradient-mesh-green", blob: "bg-green-deep/40", photo: "bg-green-deep/50" },
};

// Banner principal (home): perguntas rodando de um lado, foto integrada do
// outro, e a virada "Existe um nome para tudo isso" → SER PODER.
// O kicker "Percepção · Escolha · Presença" saiu a pedido da Andrea (19/08/2026).
export default async function HomeBanner() {
  // Textos do painel (Página inicial → Topo), com a tradução como rede.
  const locale = await getLocale();
  const { doc, tx, txList } = await getPageText("homePage", "home", locale);
  const color = HERO_COLORS.find((c) => c.value === doc?.heroColor)?.value ?? "wine";
  const theme = HERO_THEME[color];

  return (
    <section className={`relative flex min-h-[calc(100svh_-_var(--header-h))] items-center overflow-hidden ${theme.bg} text-cream`}>
      <div className={`${theme.mesh} pointer-events-none absolute inset-0`} />
      <div className={`blob animate-float absolute -left-24 top-10 h-80 w-80 ${theme.blob}`} />
      <div className="blob animate-float-2 absolute -right-24 bottom-0 h-96 w-96 bg-cream/10" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-10">
        {/* Coluna do texto */}
        <div>
          <Reveal>
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-cream/45">
              {tx("rotatingLabel")}
            </p>
            {/* Altura para 3 linhas: as perguntas do painel passam de 90
                caracteres e, com 2 linhas, eram cortadas (29/09/2026). */}
            <div className="flex h-32 items-center overflow-hidden text-2xl leading-tight md:h-40 md:text-[2.1rem]">
              <RotatingQuestions questions={txList("rotatingQuestions")} />
            </div>
          </Reveal>

          <Reveal delay={140} className="mt-8">
            <div className="flex items-center gap-4">
              <span className="h-px w-12 bg-cream/40" />
              <span className="text-xs uppercase tracking-[0.2em] text-cream/50">
                {tx("answerLabel")}
              </span>
            </div>
            <h1 className="mt-4 font-serif text-7xl font-semibold uppercase tracking-tight text-cream md:text-8xl">
              {tx("title")}
            </h1>
          </Reveal>

          <Reveal delay={280} className="mt-7 max-w-xl">
            <p className="font-serif text-2xl leading-snug text-cream md:text-[1.7rem]">
              {tx("leadStrong")}
            </p>
            <p className="mt-4 text-lg leading-relaxed text-cream/80">
              {tx("lead")}
            </p>
          </Reveal>

          <Reveal delay={420} className="mt-9">
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#ser-poder"
                className="group inline-flex items-center gap-2 rounded-full border border-cream bg-cream px-7 py-3.5 text-sm font-semibold text-wine transition-all hover:gap-3 hover:bg-wine hover:text-cream"
              >
                {tx("ctaPrimary")}
                <span className="transition-transform group-hover:translate-y-0.5">
                  ↓
                </span>
              </a>
              <Link
                href="/sobre"
                className="rounded-full border border-cream/25 px-7 py-3.5 text-sm font-medium text-cream transition-colors hover:bg-cream/10"
              >
                {tx("ctaSecondary")}
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Coluna da foto integrada */}
        <Reveal delay={300} className="order-first lg:order-last">
          <BannerPhoto priority home backdrop={theme.photo} />
        </Reveal>
      </div>
    </section>
  );
}
