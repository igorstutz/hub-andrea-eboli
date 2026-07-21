import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/Reveal";
import RotatingQuestions from "@/components/RotatingQuestions";
import BannerPhoto from "@/components/BannerPhoto";

// Banner principal (home) — estilo Brené Brown / Esther Perel:
// slogan "SER PODER" + perguntas rodando de um lado, foto integrada do outro,
// kicker "Percepção · Escolha · Presença". Sem "reconhecida por".
export default async function HomeBanner() {
  const t = await getTranslations("home");
  const tb = await getTranslations("banner");

  return (
    <section className="relative flex min-h-[calc(100svh_-_var(--header-h))] items-center overflow-hidden bg-green-deep text-cream">
      <div className="gradient-mesh pointer-events-none absolute inset-0" />
      <div className="blob animate-float absolute -left-24 top-10 h-80 w-80 bg-wine/25" />
      <div className="blob animate-float-2 absolute -right-24 bottom-0 h-96 w-96 bg-green-soft/25" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-10">
        {/* Coluna do texto */}
        <div>
          <Reveal>
            <span className="kicker text-cream/55">{tb("kicker")}</span>
          </Reveal>

          <Reveal delay={120} className="mt-7">
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-cream/45">
              {t("rotatingLabel")}
            </p>
            <div className="flex h-24 items-center overflow-hidden text-2xl leading-tight md:h-28 md:text-4xl">
              <RotatingQuestions />
            </div>
          </Reveal>

          <Reveal delay={240} className="mt-8">
            <div className="flex items-center gap-4">
              <span className="h-px w-12 bg-cream/40" />
              <span className="text-xs uppercase tracking-[0.2em] text-cream/50">
                {t("answerLabel")}
              </span>
            </div>
            <h1 className="mt-4 font-serif text-7xl font-semibold uppercase tracking-tight text-cream md:text-8xl">
              {t("title")}
            </h1>
          </Reveal>

          <Reveal delay={360} className="mt-6 max-w-xl">
            <p className="text-lg leading-relaxed text-cream/80">{t("lead")}</p>
          </Reveal>

          <Reveal delay={480} className="mt-9">
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#bibliotecas"
                className="group inline-flex items-center gap-2 rounded-full bg-cream px-7 py-3.5 text-sm font-semibold text-green-deep transition-all hover:gap-3 hover:bg-white"
              >
                {t("ctaPrimary")}
                <span className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </a>
              <Link
                href="/sobre"
                className="rounded-full border border-cream/25 px-7 py-3.5 text-sm font-medium text-cream transition-colors hover:bg-cream/10"
              >
                {t("ctaSecondary")}
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Coluna da foto integrada */}
        <Reveal delay={300} className="order-first lg:order-last">
          <BannerPhoto priority />
        </Reveal>
      </div>
    </section>
  );
}
