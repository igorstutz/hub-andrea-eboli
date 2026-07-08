"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { searchQuery } from "@/sanity/lib/queries";
import { apiVersion, dataset, projectId } from "@/sanity/env";

// Busca global executada NO NAVEGADOR, direto na CDN pública do Sanity —
// necessária no site estático (GitHub Pages), onde não há servidor.

type Result = { type: string; title: string; slug: string; excerpt?: string };

const TYPE_TO_PATH: Record<string, string> = {
  question: "/perguntas",
  concept: "/conceitos",
  caseStudy: "/casos",
  article: "/artigos",
  video: "/videos",
};

export default function GlobalSearchClient({
  labels,
}: {
  labels: {
    placeholder: string;
    button: string;
    prompt: string;
    noResults: string;
    resultsFor: string;
  };
}) {
  const locale = useLocale();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);

  function onChange(value: string) {
    setQ(value);
    if (!value.trim()) setResults(null);
  }

  useEffect(() => {
    const term = q.trim();
    if (!term) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const url = new URL(
          `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}`,
        );
        url.searchParams.set("query", searchQuery);
        url.searchParams.set("$locale", JSON.stringify(locale));
        url.searchParams.set("$q", JSON.stringify(`${term}*`));
        const res = await fetch(url, { signal: ctrl.signal });
        const data = (await res.json()) as { result?: Result[] };
        setResults(data.result ?? []);
      } catch {
        // requisição abortada (digitação) ou falha de rede — mantém estado
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q, locale]);

  const query = q.trim();

  return (
    <div>
      <form onSubmit={(e) => e.preventDefault()} className="flex gap-3">
        <input
          type="search"
          name="q"
          value={q}
          onChange={(e) => onChange(e.currentTarget.value)}
          placeholder={labels.placeholder}
          className="flex-1 rounded-full border border-ink/15 bg-white px-5 py-3 text-ink outline-none focus:border-green-deep"
        />
        <button
          type="submit"
          className="rounded-full bg-green-deep px-6 py-3 font-medium text-cream transition-colors hover:bg-green-soft"
        >
          {labels.button}
        </button>
      </form>

      <div className="mt-10">
        {!query ? (
          <p className="text-ink-soft">{labels.prompt}</p>
        ) : results === null ? null : results.length === 0 ? (
          <p className="text-ink-soft">
            {labels.noResults} “{query}”.
          </p>
        ) : (
          <>
            <p className="mb-6 text-sm text-muted">
              {labels.resultsFor} “{query}”
            </p>
            <ul className="divide-y divide-ink/10 border-y border-ink/10">
              {results.map((r) => (
                <li key={`${r.type}-${r.slug}`}>
                  <Link
                    href={`${TYPE_TO_PATH[r.type] ?? "/"}/${r.slug}`}
                    className="block py-5 transition-colors hover:bg-bone"
                  >
                    <h2 className="font-serif text-xl text-green-deep">
                      {r.title}
                    </h2>
                    {r.excerpt && (
                      <p className="mt-1 line-clamp-2 text-sm text-ink-soft">
                        {r.excerpt}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
