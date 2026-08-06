"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";

// Busca instantânea das bibliotecas: filtra a lista no cliente enquanto o
// usuário digita — sem recarregar, ignorando acentos/maiúsculas e exigindo
// que TODAS as palavras da consulta apareçam (título + texto + badge).

export type LibraryItem = {
  slug: string;
  title: string;
  badge?: string; // tema (pergunta) / tipo (artigo)
  meta?: string; // data formatada (artigo)
  text?: string; // resposta / definição / descrição / resumo
  image?: string; // thumbnail (vídeo)
  tag?: string; // rótulo da fonte (artigo) — aparece como chip discreto
  filter?: string; // valor usado pelos botões de filtro (ex.: "linkedin")
};

/** Filtro por "categoria" (hoje: a fonte do artigo). */
export type LibraryFilter = { value: string; label: string };

export type LibraryVariant =
  | "questions"
  | "concepts"
  | "cases"
  | "articles"
  | "videos";

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

function matches(item: LibraryItem, query: string): boolean {
  const haystack = normalize(
    [item.title, item.text, item.badge, item.meta, item.tag]
      .filter(Boolean)
      .join(" "),
  );
  return normalize(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

/* ---------- Cards por biblioteca (mesmo visual das listagens) ---------- */

function QuestionCard({ item }: { item: LibraryItem }) {
  return (
    <Link
      href={`/perguntas/${item.slug}`}
      className="group block h-full rounded-xl border border-ink/10 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[0_30px_70px_-40px_rgba(31,61,47,0.4)]"
    >
      {item.badge && (
        <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-wine">
          {item.badge}
        </span>
      )}
      <h2 className="mt-1 font-serif text-xl leading-snug text-wine transition-colors group-hover:text-wine-soft">
        {item.title}
      </h2>
      {item.text && (
        <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{item.text}</p>
      )}
    </Link>
  );
}

function ConceptRow({ item, index }: { item: LibraryItem; index: number }) {
  return (
    <Link
      href={`/conceitos/${item.slug}`}
      className="group flex items-baseline gap-5 py-8 transition-colors hover:bg-bone sm:gap-8"
    >
      <span className="font-serif text-2xl italic leading-none text-wine/50 transition-colors group-hover:text-wine">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
          <h2 className="min-w-[14rem] font-serif text-3xl italic text-green-deep transition-colors group-hover:text-wine">
            {item.title}
          </h2>
          {item.text && <p className="text-ink-soft">{item.text}</p>}
        </span>
      </span>
      <span
        className="hidden self-center text-wine opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 sm:block"
        aria-hidden
      >
        →
      </span>
    </Link>
  );
}

function CaseCard({ item }: { item: LibraryItem }) {
  return (
    <Link
      href={`/casos/${item.slug}`}
      className="group relative block h-full overflow-hidden rounded-xl border border-ink/10 bg-white p-7 transition-all hover:-translate-y-1 hover:shadow-[0_30px_70px_-40px_rgba(31,61,47,0.4)]"
    >
      <div className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-green-soft to-wine transition-transform duration-500 group-hover:scale-x-100" />
      <h2 className="font-serif text-2xl italic text-green-deep">{item.title}</h2>
      {item.text && (
        <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{item.text}</p>
      )}
    </Link>
  );
}

function ArticleRow({ item }: { item: LibraryItem }) {
  return (
    <Link
      href={`/artigos/${item.slug}`}
      className="group flex items-center gap-6 py-7 transition-colors hover:bg-bone"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          {item.badge && (
            <span className="rounded-full border border-wine/30 bg-wine/5 px-2.5 py-0.5 text-[0.66rem] font-semibold uppercase tracking-wider text-wine">
              {item.badge}
            </span>
          )}
          {item.tag && (
            <span className="rounded-full border border-green-deep/25 px-2.5 py-0.5 text-[0.66rem] font-semibold uppercase tracking-wider text-green-soft">
              {item.tag}
            </span>
          )}
          {item.meta && <span>{item.meta}</span>}
        </div>
        <h2 className="mt-2 font-serif text-2xl leading-snug text-wine transition-colors group-hover:text-wine-soft">
          {item.title}
        </h2>
        {item.text && (
          <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{item.text}</p>
        )}
      </div>
      <span
        className="hidden shrink-0 text-wine opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 sm:block"
        aria-hidden
      >
        →
      </span>
    </Link>
  );
}

function VideoCard({ item }: { item: LibraryItem }) {
  return (
    <Link
      href={`/videos/${item.slug}`}
      className="group block h-full overflow-hidden rounded-xl border border-ink/10 bg-white transition-all hover:-translate-y-1 hover:shadow-[0_30px_70px_-40px_rgba(31,61,47,0.4)]"
    >
      <div className="relative overflow-hidden">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt=""
            className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="aspect-video w-full bg-green-deep/10" />
        )}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-darker/70 text-cream backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-wine">
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-5 w-5" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      </div>
      <div className="p-5">
        <h2 className="font-serif text-xl leading-snug text-green-deep">
          {item.title}
        </h2>
        {item.text && (
          <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{item.text}</p>
        )}
      </div>
    </Link>
  );
}

/* ---------- Componente principal ---------- */

export default function LibrarySearch({
  items,
  variant,
  placeholder,
  noResultsLabel,
  filters,
  filtersLabel,
  allLabel,
}: {
  items: LibraryItem[];
  variant: LibraryVariant;
  placeholder: string;
  noResultsLabel: string; // ex.: 'Nada encontrado para'
  // Filtro por categoria (hoje: fonte do artigo). Sem `filters`, nada aparece.
  filters?: LibraryFilter[];
  filtersLabel?: string; // ex.: 'Fonte'
  allLabel?: string; // ex.: 'Todas'
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const base = active ? items.filter((i) => i.filter === active) : items;
    return query.trim() ? base.filter((i) => matches(i, query)) : base;
  }, [items, query, active]);

  const chip = (on: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
      on
        ? "bg-wine text-cream"
        : "border border-ink/15 bg-white text-ink-soft hover:border-wine/40 hover:text-wine"
    }`;

  return (
    <div>
      {/* Filtro por categoria */}
      {filters && filters.length > 1 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {filtersLabel && (
            <span className="kicker mr-1 text-muted">{filtersLabel}</span>
          )}
          <button
            type="button"
            onClick={() => setActive(null)}
            aria-pressed={active === null}
            className={chip(active === null)}
          >
            {allLabel ?? "—"}
          </button>
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setActive((cur) => (cur === f.value ? null : f.value))}
              aria-pressed={active === f.value}
              className={chip(active === f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Barra de pesquisa */}
      <div className="relative mb-10 max-w-xl">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3-3" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          placeholder={placeholder}
          className="w-full rounded-full border border-ink/15 bg-white py-3.5 pr-5 text-ink shadow-[0_10px_40px_-20px_rgba(31,61,47,0.25)] outline-none transition-colors placeholder:text-muted focus:border-green-deep"
          style={{ paddingLeft: "3.25rem" }}
        />
      </div>

      {/* Resultados */}
      {filtered.length === 0 ? (
        <p className="text-ink-soft">
          {noResultsLabel} “{query.trim()}”.
        </p>
      ) : variant === "questions" ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {filtered.map((i) => (
            <li key={i.slug}>
              <QuestionCard item={i} />
            </li>
          ))}
        </ul>
      ) : variant === "concepts" ? (
        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {filtered.map((i, idx) => (
            <li key={i.slug}>
              <ConceptRow item={i} index={idx} />
            </li>
          ))}
        </ul>
      ) : variant === "cases" ? (
        <ul className="grid gap-5 sm:grid-cols-2">
          {filtered.map((i) => (
            <li key={i.slug}>
              <CaseCard item={i} />
            </li>
          ))}
        </ul>
      ) : variant === "articles" ? (
        <div className="divide-y divide-ink/10 border-y border-ink/10">
          {filtered.map((i) => (
            <ArticleRow key={i.slug} item={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((i) => (
            <VideoCard key={i.slug} item={i} />
          ))}
        </div>
      )}
    </div>
  );
}
