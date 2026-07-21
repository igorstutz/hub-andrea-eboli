import { Link } from "@/i18n/navigation";

type Crumb = { label: string; href?: string };

// Cabeçalho das páginas de LISTAGEM (bibliotecas) — mesmo tratamento editorial
// do DetailHeader: blobs sutis, título grande e lead serifado.
export default function PageHeader({
  crumbs,
  title,
  lead,
  badge,
}: {
  crumbs: Crumb[];
  title: string;
  lead?: string;
  badge?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-ink/10 bg-bone">
      <div className="blob absolute -right-28 -top-28 h-80 w-80 bg-wine/12" />
      <div className="blob absolute -bottom-40 -left-24 h-72 w-72 bg-green-deep/10" />

      <div className="relative mx-auto max-w-5xl px-6 py-16">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-muted">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-ink/30">/</span>}
              {c.href ? (
                <Link href={c.href} className="transition-colors hover:text-wine">
                  {c.label}
                </Link>
              ) : (
                <span className="text-ink-soft">{c.label}</span>
              )}
            </span>
          ))}
        </nav>

        {badge && (
          <span className="mb-5 inline-block rounded-full border border-wine/30 bg-wine/5 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-wine">
            {badge}
          </span>
        )}

        <h1 className="text-4xl leading-[1.08] text-green-deep md:text-6xl">
          {title}
        </h1>

        {lead && (
          <p className="mt-6 max-w-2xl border-l-2 border-wine pl-5 font-serif text-xl italic leading-relaxed text-ink-soft md:text-2xl">
            {lead}
          </p>
        )}
      </div>
    </section>
  );
}
