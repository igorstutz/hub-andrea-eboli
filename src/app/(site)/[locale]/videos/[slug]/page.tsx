import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PortableTextBody from "@/components/PortableTextBody";
import VideoEmbed from "@/components/VideoEmbed";
import JsonLd from "@/components/JsonLd";
import { sanityFetch } from "@/sanity/lib/fetch";
import { videoBySlugQuery } from "@/sanity/lib/queries";
import {
  parseYouTubeId,
  formatDurationISO,
  formatDurationHuman,
  thumbnailUrl,
} from "@/lib/youtube";
import { alternatesFor, localizedUrl } from "@/lib/seo";

type Chapter = { startTime: number; title: string };
type RefItem = { title: string; slug: string };
type RelatedQuestion = RefItem & { answer?: string };
type RelatedConcept = RefItem & { shortDefinition?: string };

type VideoDetail = {
  title: string;
  slug: string;
  youtubeUrl?: string;
  publishedAt?: string;
  durationSeconds?: number;
  directAnswer?: string;
  summary?: string;
  keyTakeaways?: unknown;
  chapters?: Chapter[];
  transcript?: unknown;
  topic?: RefItem | null;
  relatedQuestions?: RelatedQuestion[];
  relatedConcepts?: RelatedConcept[];
  metaTitle?: string;
  metaDescription?: string;
} | null;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const v = await sanityFetch<VideoDetail>(videoBySlugQuery, { locale, slug });
  if (!v) return {};
  return {
    title: v.metaTitle || v.title,
    description: v.metaDescription || v.directAnswer || v.summary,
    alternates: alternatesFor(`/videos/${slug}`),
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const v = await sanityFetch<VideoDetail>(videoBySlugQuery, { locale, slug });
  if (!v) notFound();

  const videoId = v.youtubeUrl ? parseYouTubeId(v.youtubeUrl) : null;
  const pageUrl = localizedUrl(locale, `/videos/${slug}`);
  const dateLabel = v.publishedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
        new Date(v.publishedAt),
      )
    : null;
  const durationLabel = formatDurationHuman(v.durationSeconds);

  const faqItems = (v.relatedQuestions ?? []).filter((q) => q.answer);

  // ---- JSON-LD (VideoObject + WebPage/Speakable + Breadcrumb + FAQPage) ----
  const graph: Record<string, unknown>[] = [];

  if (videoId) {
    graph.push({
      "@type": "VideoObject",
      name: v.title,
      description: v.summary || v.directAnswer || v.title,
      thumbnailUrl: [thumbnailUrl(videoId)],
      uploadDate: v.publishedAt || undefined,
      duration: formatDurationISO(v.durationSeconds),
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      contentUrl: v.youtubeUrl,
      url: pageUrl,
      author: { "@type": "Person", name: "Andrea Eboli" },
      ...(v.chapters && v.chapters.length
        ? {
            hasPart: v.chapters.map((c) => ({
              "@type": "Clip",
              name: c.title,
              startOffset: c.startTime,
              url: `${v.youtubeUrl}&t=${c.startTime}s`,
            })),
          }
        : {}),
    });
  }

  graph.push({
    "@type": "WebPage",
    url: pageUrl,
    ...(v.directAnswer
      ? {
          speakable: {
            "@type": "SpeakableSpecification",
            cssSelector: ["#resposta-direta"],
          },
        }
      : {}),
  });

  graph.push({
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t("common.home"),
        item: localizedUrl(locale, "/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("libraries.videos.name"),
        item: localizedUrl(locale, "/videos"),
      },
      { "@type": "ListItem", position: 3, name: v.title, item: pageUrl },
    ],
  });

  if (faqItems.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faqItems.map((q) => ({
        "@type": "Question",
        name: q.title,
        acceptedAnswer: { "@type": "Answer", text: q.answer },
      })),
    });
  }

  const jsonLd = { "@context": "https://schema.org", "@graph": graph };

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* Cabeçalho */}
      <section className="border-b border-ink/10 bg-bone">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-muted">
            <Link href="/" className="transition-colors hover:text-wine">
              {t("common.home")}
            </Link>
            <span className="text-ink/30">/</span>
            <Link href="/videos" className="transition-colors hover:text-wine">
              {t("libraries.videos.name")}
            </Link>
            <span className="text-ink/30">/</span>
            <span className="text-ink-soft">{v.title}</span>
          </nav>

          {v.topic && (
            <Link
              href={`/perguntas`}
              className="mb-4 inline-block rounded-full bg-green-deep/5 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-green-soft"
            >
              {v.topic.title}
            </Link>
          )}

          <h1 className="text-4xl text-green-deep md:text-5xl">{v.title}</h1>

          {(dateLabel || durationLabel) && (
            <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
              {dateLabel && <span>{dateLabel}</span>}
              {dateLabel && durationLabel && <span className="text-ink/30">·</span>}
              {durationLabel && <span>{durationLabel}</span>}
            </p>
          )}

          {v.summary && (
            <p className="mt-4 max-w-2xl text-lg text-ink-soft">{v.summary}</p>
          )}
        </div>
      </section>

      {/* Split: player fixo + conteúdo */}
      <section className="bg-cream">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[360px_1fr]">
          {/* Player (fixo no desktop) */}
          <aside className="self-start lg:sticky lg:top-24">
            {videoId ? (
              <VideoEmbed
                videoId={videoId}
                title={v.title}
                chapters={v.chapters}
                shareUrl={pageUrl}
                youtubeUrl={v.youtubeUrl}
                labels={{
                  chapters: t("videoPage.chapters"),
                  watch: t("videoPage.watchOnYouTube"),
                  copy: t("videoPage.copyLink"),
                  copied: t("videoPage.copied"),
                }}
              />
            ) : (
              <div className="aspect-video w-full rounded-lg bg-bone" />
            )}
          </aside>

          {/* Conteúdo */}
          <div className="min-w-0">
            {v.directAnswer && (
              <div
                id="resposta-direta"
                className="mb-12 rounded-r-lg border-l-2 border-gold bg-bone/60 px-6 py-5"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-soft">
                  {t("videoPage.directAnswer")}
                </p>
                <p className="font-serif text-2xl leading-snug text-green-deep">
                  {v.directAnswer}
                </p>
              </div>
            )}

            {v.keyTakeaways != null && (
              <section className="mb-12">
                <h2 className="mb-4 text-2xl text-green-deep">
                  {t("videoPage.takeaways")}
                </h2>
                <PortableTextBody value={v.keyTakeaways} />
              </section>
            )}

            {faqItems.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-5 text-2xl text-green-deep">
                  {t("videoPage.faq")}
                </h2>
                <div className="divide-y divide-ink/10 border-y border-ink/10">
                  {faqItems.map((q) => (
                    <details key={q.slug} className="group py-4">
                      <summary className="cursor-pointer list-none font-serif text-lg text-green-deep marker:content-none">
                        {q.title}
                      </summary>
                      <p className="mt-2 leading-relaxed text-ink-soft">
                        {q.answer}
                      </p>
                      <Link
                        href={`/perguntas/${q.slug}`}
                        className="mt-2 inline-block text-sm text-wine underline underline-offset-2 hover:text-wine-soft"
                      >
                        {t("videoPage.readMore")}
                      </Link>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {v.relatedConcepts && v.relatedConcepts.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-4 text-2xl text-green-deep">
                  {t("common.relatedConcepts")}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {v.relatedConcepts.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/conceitos/${c.slug}`}
                      className="rounded-full border border-ink/15 px-4 py-1.5 text-sm text-ink-soft transition-colors hover:border-green-deep hover:text-green-deep"
                    >
                      {c.title}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {v.transcript != null && (
              <details className="border-t border-ink/10 pt-6">
                <summary className="cursor-pointer text-sm font-medium uppercase tracking-wider text-muted">
                  {t("videoPage.transcript")}
                </summary>
                <div className="mt-6">
                  <PortableTextBody value={v.transcript} />
                </div>
              </details>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
