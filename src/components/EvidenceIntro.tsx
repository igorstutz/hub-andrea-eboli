import { getTranslations } from "next-intl/server";
import Reveal from "@/components/Reveal";

// Abertura comum das páginas Pesquisa e Confraria: as duas contam a mesma
// história (o método é construído no encontro entre pesquisa e experiência),
// então o texto do par abre as duas e a frase-síntese fecha o bloco.
export default async function EvidenceIntro() {
  const t = await getTranslations("evidence");

  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-3xl px-6 py-20 md:py-24">
        <Reveal>
          <p className="kicker text-wine">{t("label")}</p>
        </Reveal>
        <Reveal delay={100}>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            {t("intro")}
          </p>
        </Reveal>
        <Reveal delay={220}>
          <p className="mt-10 border-l-2 border-wine pl-5 font-serif text-2xl italic leading-snug text-green-deep md:text-3xl">
            {t("quote")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
