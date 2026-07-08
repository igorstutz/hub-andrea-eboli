import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

type Crumb = { label: string; href?: string };

// Cabeçalho editorial das páginas de DETALHE (artigo, pergunta, conceito, caso):
// breadcrumb, badge dourado + metadados, título grande e lead serifado.
export default function DetailHeader({
  crumbs,
  badge,
  meta,
  title,
  lead,
}: {
  crumbs: Crumb[];
  badge?: string;
  meta?: ReactNode;
  title: string;
  lead?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-ink/10 bg-bone">
      {/* brilhos decorativos, sutis */}
      <div className="blob absolute -right-28 -top-28 h-80 w-80 bg-gold/15" />
      <div className="blob absolute -bottom-40 -left-24 h-72 w-72 bg-green-deep/8" />

      <div className="relative mx-auto max-w-6xl px-6 py-16">
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

        {(badge || meta) && (
          <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-muted">
            {badge && (
              <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-gold">
                {badge}
              </span>
            )}
            {meta}
          </div>
        )}

        <h1 className="max-w-4xl text-4xl leading-[1.08] text-green-deep md:text-6xl">
          {title}
        </h1>

        {lead && (
          <p className="mt-6 max-w-2xl border-l-2 border-gold pl-5 font-serif text-xl italic leading-relaxed text-ink-soft md:text-2xl">
            {lead}
          </p>
        )}
      </div>
    </section>
  );
}
