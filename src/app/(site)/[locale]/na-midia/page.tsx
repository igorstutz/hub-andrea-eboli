import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageBanner from "@/components/PageBanner";
import Reveal from "@/components/Reveal";
import { pageMetadata } from "@/lib/seo";
import { getPageText } from "@/lib/pageText";
import { sanityFetch } from "@/sanity/lib/fetch";
import { pressListQuery } from "@/sanity/lib/queries";

/* ------------------------------------------------------------------
   NA MÍDIA

   A página voltou para o menu em 31/08/2026 (pedido do Igor: "vamos começar o
   processo de divulgação em breve"). Ela tinha saído da navegação em 19/08 e
   era só um estado vazio.

   A LISTA JUNTA DUAS FONTES (26/09/2026, pedido do Igor):
     · artigos com "Aparecer em Na mídia" ligado (campo `showInMedia`; na
       importação por link a ferramenta pergunta sim/não). Antes entrava todo
       artigo da Forbes/LinkedIn, sem escolha;
     · menções avulsas (tipo `mediaMention`): pesquisa que a cita, matéria em
       que foi mencionada, entrevista, podcast, palestra.

   O título aponta para o ORIGINAL no veículo, que é o que "na mídia" quer
   dizer; artigo sem link da fonte leva à página dele no hub.

   ⚠️ DATA SÓ NAS MENÇÕES. O `publishedAt` de um artigo importado é a data da
   IMPORTAÇÃO, não a do veículo (no da Forbes: 06/08/2026 no hub, 16/12/2025
   no original). Data errada numa página de imprensa é pior do que nenhuma. A
   menção tem o campo `date`, que é a data do veículo, e essa aparece.
------------------------------------------------------------------- */
type PressItem = {
  type: "article" | "mediaMention";
  key: string;
  title: string;
  slug?: string;
  source?: string;
  outlet?: string;
  kind?: string;
  url?: string;
  excerpt?: string;
  date?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const { tx: tp } = await getPageText("mediaPage", "mediaPage", locale);
  return pageMetadata({
    title: t("media"),
    description: tp("headline"),
    path: "/na-midia",
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
  const { tx: t } = await getPageText("mediaPage", "mediaPage", locale);
  const tc = await getTranslations("common");
  const tn = await getTranslations("nav");
  const ts = await getTranslations("articleSources");
  const tk = await getTranslations("mediaKinds");

  const press =
    (await sanityFetch<PressItem[] | null>(pressListQuery, {
      locale,
    })) ?? [];

  return (
    <>
      <PageBanner
        crumbs={[{ label: tc("home"), href: "/" }, { label: tn("media") }]}
        badge={t("badge")}
        title={tn("media")}
        lead={t("headline")}
      />

      {/* Aparições e publicações */}
      <section className="bg-bone">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <Reveal>
            <h2 className="text-3xl text-green-deep md:text-4xl">
              {t("pressTitle")}
            </h2>
          </Reveal>

          {press.length > 0 ? (
            <ul className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
              {press.map((item, i) => (
                // O Reveal vai DENTRO do <li>: ele renderiza uma div, e uma
                // div solta entre <ul> e <li> é HTML inválido (o leitor de
                // tela deixa de enxergar a lista).
                <li key={item.key} className="py-8">
                  <Reveal delay={i * 80}>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span className="inline-block rounded-full border border-wine/25 bg-wine/5 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-wine">
                        {item.type === "mediaMention"
                          ? item.outlet
                          : ts(item.source ?? "original")}
                      </span>
                      {item.type === "mediaMention" && item.kind && (
                        <span className="text-xs uppercase tracking-[0.14em] text-muted">
                          {tk(item.kind)}
                        </span>
                      )}
                      {item.date && (
                        <span className="text-xs text-muted">
                          {new Intl.DateTimeFormat(locale, {
                            dateStyle: "long",
                            timeZone: "UTC",
                          }).format(new Date(`${item.date}T00:00:00Z`))}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 text-2xl leading-snug">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-wine transition-colors hover:text-wine-soft"
                        >
                          {item.title}
                        </a>
                      ) : (
                        <Link
                          href={`/artigos/${item.slug}`}
                          className="text-wine transition-colors hover:text-wine-soft"
                        >
                          {item.title}
                        </Link>
                      )}
                    </h3>

                    {item.excerpt && (
                      <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">
                        {item.excerpt}
                      </p>
                    )}

                    <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-2 font-medium text-green-deep transition-all hover:gap-3"
                        >
                          {t("readAtSource")}
                          <span className="transition-transform group-hover:translate-x-0.5">
                            →
                          </span>
                        </a>
                      )}
                      {item.type === "article" && item.slug && (
                        <Link
                          href={`/artigos/${item.slug}`}
                          className="text-muted underline decoration-ink/20 underline-offset-4 transition-colors hover:text-wine"
                        >
                          {t("readAtHub")}
                        </Link>
                      )}
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-ink/15 bg-cream px-6 py-16 text-center">
              <p className="mx-auto max-w-md text-ink-soft">{t("empty")}</p>
            </div>
          )}
        </div>
      </section>

      {/* Contato para imprensa — a página existe para ser usada na divulgação */}
      <section className="relative overflow-hidden bg-wine text-cream">
        <div className="blob animate-float absolute -right-16 -top-16 h-72 w-72 bg-cream/15" />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center">
          <Reveal>
            <h2 className="text-3xl italic md:text-4xl">
              {t("pressKitTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-cream/85">
              {t("pressKitBody")}
            </p>
            <Link
              href="/contato"
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-cream px-7 py-3.5 text-sm font-semibold text-wine transition-all hover:gap-3 hover:bg-white"
            >
              {t("pressKitCta")}
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
