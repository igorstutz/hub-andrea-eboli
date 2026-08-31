import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageBanner from "@/components/PageBanner";
import Reveal from "@/components/Reveal";
import { pageMetadata } from "@/lib/seo";
import { sanityFetch } from "@/sanity/lib/fetch";
import { pressListQuery } from "@/sanity/lib/queries";

/* ------------------------------------------------------------------
   NA MÍDIA

   A página voltou para o menu em 31/08/2026 (pedido do Igor: "vamos começar o
   processo de divulgação em breve"). Ela tinha saído da navegação em 19/08 e
   era só um estado vazio.

   Para não devolver ao menu uma página em branco, a lista agora é REAL: lê do
   Sanity os artigos cuja fonte é um veículo externo (Forbes, LinkedIn) e que
   têm o link de origem. Ou seja, a Andrea alimenta esta página pelo mesmo
   lugar onde já publica, sem schema novo.

   O título de cada item aponta para o ORIGINAL no veículo, que é o que "na
   mídia" quer dizer; o link secundário leva à versão no hub, quando existe.

   ⚠️ A LISTA NÃO MOSTRA DATA, de propósito. O `publishedAt` de um artigo
   importado é a data da IMPORTAÇÃO para o hub, não a da publicação no veículo:
   no artigo da Forbes ele está em 06/08/2026, enquanto a própria URL do
   original diz 16/12/2025. Data errada numa página de imprensa é pior do que
   nenhuma. Para ligar a data de volta: corrigir `publishedAt` no Studio para a
   data do veículo e devolver o bloco `{date && ...}` abaixo da pastilha.

   ⏭️ Palcos e podcasts (NRF, SXSW, BrasaConnect, ONU, Gerações Cast) aparecem
   nas fotos do /sobre mas não existem como documento no Sanity. Enquanto não
   existirem, esta lista mostra só a imprensa escrita.
------------------------------------------------------------------- */
type PressItem = {
  title: string;
  slug?: string;
  source: string;
  sourceUrl: string;
  excerpt?: string;
  /** Só chega aqui para o dia em que a data do veículo for confiável (ver o
   *  aviso acima). Hoje a lista não mostra data. */
  publishedAt?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const tp = await getTranslations({ locale, namespace: "mediaPage" });
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
  const t = await getTranslations("mediaPage");
  const tc = await getTranslations("common");
  const tn = await getTranslations("nav");
  const ts = await getTranslations("articleSources");

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
                <li key={item.sourceUrl} className="py-8">
                  <Reveal delay={i * 80}>
                    <span className="inline-block rounded-full border border-wine/25 bg-wine/5 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-wine">
                      {ts(item.source)}
                    </span>

                    <h3 className="mt-4 text-2xl leading-snug">
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-wine transition-colors hover:text-wine-soft"
                      >
                        {item.title}
                      </a>
                    </h3>

                    {item.excerpt && (
                      <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">
                        {item.excerpt}
                      </p>
                    )}

                    <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2 font-medium text-green-deep transition-all hover:gap-3"
                      >
                        {t("readAtSource")}
                        <span className="transition-transform group-hover:translate-x-0.5">
                          →
                        </span>
                      </a>
                      {item.slug && (
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
