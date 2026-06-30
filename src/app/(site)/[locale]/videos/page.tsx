import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";
import { sanityFetch } from "@/sanity/lib/fetch";
import { videosListQuery } from "@/sanity/lib/queries";
import { parseYouTubeId, thumbnailUrl } from "@/lib/youtube";
import { alternatesFor } from "@/lib/seo";

type VideoItem = {
  title: string;
  slug: string;
  summary?: string;
  youtubeUrl?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "libraries" });
  return {
    title: t("videos.name"),
    description: t("videos.desc"),
    alternates: alternatesFor("/videos"),
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const items = await sanityFetch<VideoItem[]>(videosListQuery, { locale });

  return (
    <>
      <PageHeader
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("libraries.videos.name") },
        ]}
        title={t("libraries.videos.name")}
        lead={t("libraries.videos.desc")}
      />
      <section className="bg-cream">
        <div className="mx-auto max-w-5xl px-6 py-16">
          {items.length === 0 ? (
            <p className="text-ink-soft">{t("common.empty")}</p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2">
              {items.map((v) => {
                const id = v.youtubeUrl ? parseYouTubeId(v.youtubeUrl) : null;
                return (
                  <Link
                    key={v.slug}
                    href={`/videos/${v.slug}`}
                    className="group block overflow-hidden rounded-lg border border-ink/10 bg-bone transition-colors hover:border-green-deep/30"
                  >
                    {id && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbnailUrl(id)}
                        alt=""
                        className="aspect-video w-full object-cover"
                      />
                    )}
                    <div className="p-5">
                      <h2 className="font-serif text-xl text-green-deep">
                        {v.title}
                      </h2>
                      {v.summary && (
                        <p className="mt-2 line-clamp-2 text-sm text-ink-soft">
                          {v.summary}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
