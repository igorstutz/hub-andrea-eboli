import { Link } from "@/i18n/navigation";

type Crumb = { label: string; href?: string };

// Banner das páginas internas (abas de topo) — versão compacta do banner da
// home, para dar a mesma presença de marca em todas as abas (ideia do site do
// Simon Sinek). Fundo verde, malha sutil, marca d'água "SER PODER".
export default function PageBanner({
  crumbs,
  kicker,
  title,
  lead,
  badge,
}: {
  crumbs: Crumb[];
  kicker?: string;
  title: string;
  lead?: string;
  badge?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-green-deep text-cream">
      <div className="gradient-mesh pointer-events-none absolute inset-0 opacity-60" />
      <div className="blob absolute -right-24 -top-24 h-80 w-80 bg-wine/25" />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-10 right-4 select-none font-serif text-[8rem] font-semibold uppercase leading-none tracking-tight text-cream/[0.04] md:text-[12rem]"
      >
        Poder
      </span>

      <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-20">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-cream/50">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-cream/25">/</span>}
              {c.href ? (
                <Link
                  href={c.href}
                  className="transition-colors hover:text-cream"
                >
                  {c.label}
                </Link>
              ) : (
                <span className="text-cream/80">{c.label}</span>
              )}
            </span>
          ))}
        </nav>

        {(badge || kicker) && (
          <div className="mb-5 flex flex-wrap items-center gap-3">
            {badge && (
              <span className="inline-flex items-center gap-2 rounded-full border border-cream/25 bg-cream/5 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-cream/90">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-cream/80" />
                {badge}
              </span>
            )}
            {kicker && <span className="kicker text-cream/50">{kicker}</span>}
          </div>
        )}

        <h1 className="max-w-4xl font-serif text-4xl font-semibold leading-[1.05] text-cream md:text-6xl">
          {title}
        </h1>

        {lead && (
          <p className="mt-6 max-w-2xl border-l-2 border-cream/40 pl-5 font-serif text-xl italic leading-relaxed text-cream/80 md:text-2xl">
            {lead}
          </p>
        )}
      </div>
    </section>
  );
}
