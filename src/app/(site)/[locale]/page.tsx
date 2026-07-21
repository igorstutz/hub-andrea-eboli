import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/Reveal";
import HomeBanner from "@/components/HomeBanner";
import LibraryIcon from "@/components/LibraryIcon";
import NewsletterForm from "@/components/NewsletterForm";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  questionsListQuery,
  conceptsListQuery,
  casesListQuery,
  articlesListQuery,
  videosListQuery,
} from "@/sanity/lib/queries";
import { parseYouTubeId, thumbnailUrl, formatDurationHuman } from "@/lib/youtube";

const LIBRARIES = [
  { key: "questions", href: "/perguntas", num: "01" },
  { key: "concepts", href: "/conceitos", num: "02" },
  { key: "cases", href: "/casos", num: "03" },
  { key: "articles", href: "/artigos", num: "04" },
] as const;

type QItem = { title: string; slug: string; answer?: string; topic?: { title: string } | null };
type CItem = { title: string; slug: string; shortDefinition?: string };
type CaseItem = { title: string; slug: string; description?: string };
type AItem = { title: string; slug: string; kind?: string; excerpt?: string; publishedAt?: string };
type VItem = { title: string; slug: string; summary?: string; youtubeUrl?: string; durationSeconds?: number };

// Cabeçalho padrão das seções de conteúdo da home: badge com ponto pulsante
// (eco do banner), título, lead e CTA em pill que preenche no hover.
function SectionHeading({
  badge,
  title,
  lead,
  href,
  cta,
  dark = false,
}: {
  badge?: string;
  title: string;
  lead?: string;
  href: string;
  cta: string;
  dark?: boolean;
}) {
  return (
    <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        {badge && (
          <span
            className={`mb-4 inline-flex items-center gap-2.5 rounded-full border px-3.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] ${
              dark
                ? "border-cream/25 bg-cream/10 text-cream/90"
                : "border-wine/20 bg-wine/5 text-wine"
            }`}
          >
            <span
              className={`pulse-dot h-1.5 w-1.5 rounded-full ${dark ? "bg-cream/80" : "bg-wine"}`}
            />
            {badge}
          </span>
        )}
        <h2 className={`text-3xl md:text-4xl ${dark ? "text-cream" : "text-green-deep"}`}>
          {title}
        </h2>
        {lead && (
          <p className={`mt-3 ${dark ? "text-cream/70" : "text-ink-soft"}`}>{lead}</p>
        )}
      </div>
      <Link
        href={href}
        className={`group inline-flex shrink-0 items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-all duration-300 hover:gap-3 ${
          dark
            ? "border-cream/40 text-cream hover:bg-cream hover:text-green-deep"
            : "border-wine/30 text-wine hover:bg-wine hover:text-cream"
        }`}
      >
        {cta}
        <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </Link>
    </div>
  );
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tl = await getTranslations("libraries");
  const tk = await getTranslations("articleKinds");

  // Conteúdo real das bibliotecas (datasets pequenos; fatiamos aqui).
  const [questions, concepts, cases, articles, videos] = await Promise.all([
    sanityFetch<QItem[]>(questionsListQuery, { locale }),
    sanityFetch<CItem[]>(conceptsListQuery, { locale }),
    sanityFetch<CaseItem[]>(casesListQuery, { locale }),
    sanityFetch<AItem[]>(articlesListQuery, { locale }),
    sanityFetch<VItem[]>(videosListQuery, { locale }),
  ]);

  return (
    <>
      {/* ============ BANNER ============ */}
      <HomeBanner />

      {/* ============ BIBLIOTECAS ============ */}
      <section id="bibliotecas" className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 py-28">
          <Reveal>
            <h2 className="max-w-2xl text-4xl text-green-deep md:text-5xl">
              {t("librariesTitle")}
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-4 max-w-2xl text-ink-soft">{t("librariesLead")}</p>
          </Reveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {LIBRARIES.map(({ key, href, num }, i) => (
              <Reveal key={key} delay={i * 110}>
                <Link
                  href={href}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-bone p-8 transition-all duration-500 hover:-translate-y-1.5 hover:border-transparent hover:shadow-[0_40px_90px_-40px_rgba(20,49,44,0.45)]"
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-wine/10 blur-2xl" />
                  </div>
                  <div className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-green-soft to-wine transition-transform duration-500 group-hover:scale-x-100" />

                  <div className="relative flex items-start justify-between">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-green-deep/20 bg-green-deep/5 text-green-deep transition-all duration-500 group-hover:border-transparent group-hover:bg-wine group-hover:text-cream">
                      <LibraryIcon name={key} className="h-6 w-6" />
                    </span>
                    <span className="font-serif text-4xl italic leading-none text-wine/35 transition-colors duration-500 group-hover:text-wine">
                      {num}
                    </span>
                  </div>

                  <span className="relative mt-7 inline-flex w-fit items-center rounded-full bg-green-deep/5 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-green-soft transition-colors duration-500 group-hover:bg-wine/10 group-hover:text-wine">
                    {tl(`${key}.badge`)}
                  </span>

                  <h3 className="relative mt-4 text-2xl text-green-deep">
                    {tl(`${key}.name`)}
                  </h3>
                  <p className="relative mt-2 flex-1 text-sm text-ink-soft">
                    {tl(`${key}.desc`)}
                  </p>

                  <span className="relative mt-6 flex items-center gap-2 text-wine">
                    <span className="h-px w-6 bg-wine transition-all duration-500 group-hover:w-9" />
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 -translate-x-1 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100"
                      aria-hidden
                    >
                      <path d="M5 12h14" />
                      <path d="m13 6 6 6-6 6" />
                    </svg>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ VÍDEOS E PODCAST ============ */}
      {videos.length > 0 && (
        <section className="relative overflow-hidden bg-bone">
          <div className="blob animate-float-2 absolute -left-20 top-16 h-72 w-72 bg-green-deep/8" />
          <div className="relative mx-auto max-w-6xl px-6 py-24">
            <Reveal>
              <SectionHeading
                badge={tl("videos.badge")}
                title={tl("videos.name")}
                lead={tl("videos.desc")}
                href="/videos"
                cta={t("sectionCta")}
              />
            </Reveal>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {videos.slice(0, 3).map((v, i) => {
                const id = v.youtubeUrl ? parseYouTubeId(v.youtubeUrl) : null;
                return (
                  <Reveal key={v.slug} delay={i * 90}>
                    <Link
                      href={`/videos/${v.slug}`}
                      className="group block h-full overflow-hidden rounded-xl border border-ink/10 bg-bone transition-all hover:-translate-y-1 hover:shadow-[0_30px_70px_-40px_rgba(20,49,44,0.4)]"
                    >
                      <div className="relative overflow-hidden">
                        {id ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbnailUrl(id)}
                            alt=""
                            className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="aspect-video w-full bg-green-deep/10" />
                        )}
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-darker/70 text-cream backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-wine">
                            <svg
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="ml-1 h-5 w-5"
                              aria-hidden
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </span>
                        </span>
                        {formatDurationHuman(v.durationSeconds) && (
                          <span className="absolute bottom-3 right-3 rounded-full bg-green-darker/80 px-2.5 py-0.5 text-xs font-medium text-cream backdrop-blur-sm">
                            {formatDurationHuman(v.durationSeconds)}
                          </span>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-serif text-xl leading-snug text-green-deep">
                          {v.title}
                        </h3>
                        {v.summary && (
                          <p className="mt-2 line-clamp-2 text-sm text-ink-soft">
                            {v.summary}
                          </p>
                        )}
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============ CONCEITOS (pilares — vivem em Ser Poder) ============ */}
      {concepts.length > 0 && (
        <section className="relative overflow-hidden bg-green-deep text-cream">
          <div className="gradient-mesh pointer-events-none absolute inset-0 opacity-40" />
          <div className="blob animate-float absolute -right-24 top-16 h-80 w-80 bg-wine/25" />
          <span
            aria-hidden
            className="pointer-events-none absolute -top-16 right-6 select-none font-serif text-[16rem] italic leading-none text-cream/5"
          >
            “
          </span>
          <div className="relative mx-auto max-w-6xl px-6 py-24">
            <Reveal>
              <SectionHeading
                badge={tl("concepts.badge")}
                title={tl("concepts.name")}
                lead={tl("concepts.desc")}
                href="/ser-poder"
                cta={t("sectionCta")}
                dark
              />
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {concepts.map((c, i) => (
                <Reveal key={c.slug} delay={i * 90}>
                  <Link
                    href={`/conceitos/${c.slug}`}
                    className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-cream/10 bg-cream/5 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-cream/40 hover:bg-cream/10"
                  >
                    <div className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-cream/60 to-wine transition-transform duration-500 group-hover:scale-x-100" />
                    <span
                      className="absolute right-5 top-4 font-serif text-3xl italic leading-none text-cream/20 transition-colors duration-300 group-hover:text-cream/50"
                      aria-hidden
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="pr-10 font-serif text-2xl text-cream">
                      {c.title}
                    </h3>
                    {c.shortDefinition && (
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-cream/75">
                        {c.shortDefinition}
                      </p>
                    )}
                    <span className="mt-5 flex items-center gap-2 text-cream">
                      <span className="h-px w-6 bg-cream/50 transition-all duration-500 group-hover:w-10" />
                      <span className="-translate-x-1 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100">
                        →
                      </span>
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ PERGUNTAS ============ */}
      {questions.length > 0 && (
        <section className="relative overflow-hidden bg-bone">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-20 select-none font-serif text-[22rem] italic leading-none text-wine/[0.05]"
          >
            ?
          </span>
          <div className="blob animate-float-2 absolute -left-24 bottom-0 h-72 w-72 bg-green-deep/8" />
          <div className="relative mx-auto max-w-6xl px-6 py-24">
            <Reveal>
              <SectionHeading
                badge={tl("questions.badge")}
                title={tl("questions.name")}
                lead={tl("questions.desc")}
                href="/artigos-e-perguntas"
                cta={t("sectionCta")}
              />
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {questions.slice(0, 6).map((q, i) => (
                <Reveal key={q.slug} delay={i * 70}>
                  <Link
                    href={`/perguntas/${q.slug}`}
                    className="group relative block h-full overflow-hidden rounded-xl border border-ink/10 bg-cream p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_-40px_rgba(20,49,44,0.4)]"
                  >
                    <div className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-green-soft to-wine transition-transform duration-500 group-hover:scale-x-100" />
                    <span
                      aria-hidden
                      className="absolute -right-1 -top-3 select-none font-serif text-6xl italic text-wine/5 transition-colors duration-300 group-hover:text-wine/15"
                    >
                      ?
                    </span>
                    {q.topic?.title && (
                      <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-wine">
                        {q.topic.title}
                      </span>
                    )}
                    <h3 className="mt-1 font-serif text-xl leading-snug text-green-deep transition-colors duration-300 group-hover:text-wine">
                      {q.title}
                    </h3>
                    {q.answer && (
                      <p className="mt-2 line-clamp-2 text-sm text-ink-soft">
                        {q.answer}
                      </p>
                    )}
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ CASOS ============ */}
      {cases.length > 0 && (
        <section className="relative overflow-hidden bg-cream">
          <div className="blob animate-float absolute -right-20 top-10 h-80 w-80 bg-wine/8" />
          <div className="relative mx-auto max-w-6xl px-6 py-24">
            <Reveal>
              <SectionHeading
                badge={tl("cases.badge")}
                title={tl("cases.name")}
                lead={tl("cases.desc")}
                href="/casos"
                cta={t("sectionCta")}
              />
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2">
              {cases.slice(0, 4).map((c, i) => (
                <Reveal key={c.slug} delay={i * 90}>
                  <Link
                    href={`/casos/${c.slug}`}
                    className="group relative block h-full overflow-hidden rounded-xl border border-ink/10 bg-bone p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_-40px_rgba(20,49,44,0.4)]"
                  >
                    <div className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-green-soft to-wine transition-transform duration-500 group-hover:scale-x-100" />
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-wine/10 blur-2xl" />
                    </div>
                    <span className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-green-deep/15 bg-green-deep/5 font-serif text-2xl italic text-green-deep transition-all duration-300 group-hover:border-transparent group-hover:bg-wine group-hover:text-cream">
                      {c.title.charAt(0)}
                    </span>
                    <h3 className="relative font-serif text-2xl italic text-green-deep transition-colors duration-300 group-hover:text-wine">
                      {c.title}
                    </h3>
                    {c.description && (
                      <p className="relative mt-2 line-clamp-3 text-sm text-ink-soft">
                        {c.description}
                      </p>
                    )}
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ TESE ============ */}
      <section className="relative overflow-hidden bg-green-darker text-cream">
        <div className="gradient-mesh pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative mx-auto max-w-4xl px-6 py-28 text-center">
          <Reveal>
            <span className="font-serif text-7xl leading-none text-cream/25">
              “
            </span>
            <blockquote className="-mt-6 font-serif text-3xl italic leading-snug md:text-5xl">
              {t("thesis")}
            </blockquote>
            <cite className="mt-8 block text-sm uppercase not-italic tracking-[0.2em] text-cream/70">
              {t("thesisAuthor")}
            </cite>
          </Reveal>
        </div>
      </section>

      {/* ============ ARTIGOS ============ */}
      {articles.length > 0 && (
        <section className="relative overflow-hidden bg-cream">
          <div className="blob animate-float absolute -right-24 bottom-0 h-72 w-72 bg-wine/8" />
          <div className="relative mx-auto max-w-6xl px-6 py-24">
            <Reveal>
              <SectionHeading
                badge={tl("articles.badge")}
                title={tl("articles.name")}
                lead={tl("articles.desc")}
                href="/artigos-e-perguntas"
                cta={t("sectionCta")}
              />
            </Reveal>
            <div className="divide-y divide-ink/10 border-y border-ink/10">
              {articles.slice(0, 3).map((a, i) => (
                <Reveal key={a.slug} delay={i * 80}>
                  <Link
                    href={`/artigos/${a.slug}`}
                    className="group flex items-center gap-6 py-7 transition-colors hover:bg-bone sm:gap-8"
                  >
                    <span
                      className="hidden shrink-0 font-serif text-3xl italic leading-none text-wine/40 transition-colors duration-300 group-hover:text-wine sm:block"
                      aria-hidden
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                        {a.kind && (
                          <span className="rounded-full border border-wine/30 bg-wine/5 px-2.5 py-0.5 text-[0.66rem] font-semibold uppercase tracking-wider text-wine">
                            {tk(a.kind)}
                          </span>
                        )}
                        {a.publishedAt && (
                          <span>
                            {new Intl.DateTimeFormat(locale, {
                              dateStyle: "long",
                            }).format(new Date(a.publishedAt))}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 font-serif text-2xl leading-snug text-green-deep transition-colors group-hover:text-wine">
                        {a.title}
                      </h3>
                      {a.excerpt && (
                        <p className="mt-1 line-clamp-2 text-sm text-ink-soft">
                          {a.excerpt}
                        </p>
                      )}
                    </div>
                    <span
                      className="hidden shrink-0 text-wine opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 sm:block"
                      aria-hidden
                    >
                      →
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ NEWSLETTER ============ */}
      <section className="relative overflow-hidden bg-wine text-cream">
        <div className="blob animate-float-2 absolute -left-16 -top-16 h-72 w-72 bg-cream/15" />
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-cream/25 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cream/80">
              {t("newsletterBadge")}
            </span>
          </Reveal>
          <Reveal delay={120}>
            <h2 className="mt-6 text-4xl italic md:text-5xl">
              {t("newsletterTitle")}
            </h2>
          </Reveal>
          <Reveal delay={240}>
            <p className="mx-auto mt-4 max-w-xl text-cream/85">
              {t("newsletterLead")}
            </p>
          </Reveal>
          <Reveal delay={360}>
            <NewsletterForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
