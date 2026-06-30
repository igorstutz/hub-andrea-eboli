import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/Reveal";
import RotatingQuestions from "@/components/RotatingQuestions";
import Marquee from "@/components/Marquee";
import LibraryIcon from "@/components/LibraryIcon";
import NewsletterForm from "@/components/NewsletterForm";

const LIBRARIES = [
  { key: "questions", href: "/perguntas", num: "01" },
  { key: "concepts", href: "/conceitos", num: "02" },
  { key: "cases", href: "/casos", num: "03" },
  { key: "research", href: "/pesquisas", num: "04" },
] as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Home />;
}

function Home() {
  const t = useTranslations("home");
  const tl = useTranslations("libraries");
  const credentials = t.raw("credentials") as string[];

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative flex h-[calc(100svh_-_var(--header-h))] max-h-[64rem] min-h-[40rem] items-center overflow-hidden bg-green-deep text-cream">
        {/* malha de gradiente animada */}
        <div className="gradient-mesh pointer-events-none absolute inset-0" />
        {/* blobs flutuantes */}
        <div className="blob animate-float absolute -left-24 top-10 h-80 w-80 bg-gold/20" />
        <div className="blob animate-float-2 absolute -right-20 bottom-0 h-96 w-96 bg-wine/30" />

        <div className="container relative z-10 mx-auto max-w-6xl px-6 py-6">
          <Reveal>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-gold" />
              {t("badge")}
            </span>
          </Reveal>

          <Reveal delay={120} className="mt-6 max-w-3xl">
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-cream/45">
              {t("rotatingLabel")}
            </p>
            <div className="flex h-24 items-center overflow-hidden text-2xl leading-tight md:h-32 md:text-5xl">
              <RotatingQuestions />
            </div>
          </Reveal>

          <Reveal delay={240} className="mt-8">
            <div className="flex items-center gap-4">
              <span className="h-px w-12 bg-gold/50" />
              <span className="text-xs uppercase tracking-[0.2em] text-cream/45">
                {t("answerLabel")}
              </span>
            </div>
            <h1 className="mt-4 text-6xl font-semibold italic md:text-8xl">
              <span className="text-gradient-gold">{t("title")}</span>
            </h1>
          </Reveal>

          <Reveal delay={360} className="mt-6 max-w-xl">
            <p className="text-lg font-light text-cream/80">{t("lead")}</p>
          </Reveal>

          <Reveal delay={480} className="mt-8">
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#bibliotecas"
                className="group inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 text-sm font-semibold text-green-darker transition-all hover:gap-3 hover:bg-[#cBA86b]"
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
      </section>

      {/* ============ CREDENCIAIS (marquee) ============ */}
      <section className="border-y border-ink/10 bg-bone py-10">
        <p className="mb-6 text-center text-xs uppercase tracking-[0.22em] text-muted">
          {t("credentialsLabel")}
        </p>
        <Marquee items={credentials} />
      </section>

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
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white p-8 transition-all duration-500 hover:-translate-y-1.5 hover:border-transparent hover:shadow-[0_40px_90px_-40px_rgba(31,61,47,0.45)]"
                >
                  {/* brilho de gradiente no hover */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gold/10 blur-2xl" />
                  </div>
                  {/* linha superior dourada */}
                  <div className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-gold to-wine transition-transform duration-500 group-hover:scale-x-100" />

                  <div className="relative flex items-start justify-between">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-green-deep/20 bg-green-deep/5 text-green-deep transition-all duration-500 group-hover:border-transparent group-hover:bg-wine group-hover:text-cream">
                      <LibraryIcon name={key} className="h-6 w-6" />
                    </span>
                    <span className="font-serif text-4xl italic leading-none text-gold/80 transition-colors duration-500 group-hover:text-green-deep">
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

      {/* ============ TESE ============ */}
      <section className="relative overflow-hidden bg-green-darker text-cream">
        <div className="gradient-mesh pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-4xl px-6 py-28 text-center">
          <Reveal>
            <span className="font-serif text-7xl leading-none text-gold/30">
              “
            </span>
            <blockquote className="-mt-6 font-serif text-3xl italic leading-snug md:text-5xl">
              {t("thesis")}
            </blockquote>
            <cite className="mt-8 block text-sm uppercase not-italic tracking-[0.2em] text-gold">
              {t("thesisAuthor")}
            </cite>
          </Reveal>
        </div>
      </section>

      {/* ============ NEWSLETTER ============ */}
      <section className="relative overflow-hidden bg-wine text-cream">
        <div className="blob animate-float-2 absolute -left-16 -top-16 h-72 w-72 bg-gold/15" />
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
