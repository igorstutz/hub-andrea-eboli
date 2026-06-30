import { Link } from "@/i18n/navigation";

type Crumb = { label: string; href?: string };

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
    <section className="border-b border-ink/10 bg-bone">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-muted">
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
          <span className="mb-4 inline-block rounded-full bg-green-deep/5 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-green-soft">
            {badge}
          </span>
        )}
        <h1 className="text-4xl text-green-deep md:text-5xl">{title}</h1>
        {lead && <p className="mt-4 max-w-2xl text-lg text-ink-soft">{lead}</p>}
      </div>
    </section>
  );
}
