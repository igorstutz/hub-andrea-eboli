"use client";

import { useState } from "react";

type Chapter = { startTime: number; title: string };

function fmt(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VideoEmbed({
  videoId,
  title,
  chapters,
  shareUrl,
  youtubeUrl,
  labels,
}: {
  videoId: string;
  title: string;
  // Pode vir null do GROQ quando o vídeo não tem capítulos.
  chapters?: Chapter[] | null;
  shareUrl: string;
  youtubeUrl?: string;
  labels: {
    chapters: string;
    watch: string;
    copy: string;
    copied: string;
  };
}) {
  const [start, setStart] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const chapterList = chapters ?? [];

  const src =
    `https://www.youtube-nocookie.com/embed/${videoId}` +
    (start != null ? `?start=${start}&autoplay=1` : "");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-ink/10 bg-black">
        <iframe
          key={start ?? "0"}
          className="h-full w-full"
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {youtubeUrl && (
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-full bg-green-deep px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-green-soft"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
            {labels.watch}
          </a>
        )}
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm text-ink-soft transition-colors hover:border-green-deep hover:text-green-deep"
        >
          {copied ? labels.copied : labels.copy}
        </button>
      </div>

      {chapterList.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            {labels.chapters}
          </p>
          <ul className="max-h-72 overflow-auto rounded-lg border border-ink/10 bg-bone">
            {chapterList.map((c, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setStart(c.startTime)}
                  className={`flex w-full items-baseline gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-cream ${
                    start === c.startTime ? "bg-cream" : ""
                  }`}
                >
                  <span className="shrink-0 font-mono text-xs text-wine">
                    {fmt(c.startTime)}
                  </span>
                  <span className="text-ink-soft">{c.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
