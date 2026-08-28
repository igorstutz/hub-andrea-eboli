import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import PageBanner from "@/components/PageBanner";
import LibrarySearch from "@/components/LibrarySearch";
import { sanityFetch } from "@/sanity/lib/fetch";
import { videosListQuery } from "@/sanity/lib/queries";
import { parseYouTubeId, thumbnailUrl } from "@/lib/youtube";
import { pageMetadata } from "@/lib/seo";

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
  return pageMetadata({
    title: t("videos.name"),
    description: t("videos.desc"),
    path: "/videos",
    locale,
  });
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
      <PageBanner
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("nav.videosPodcast") },
        ]}
        title={t("nav.videosPodcast")}
        lead={t("libraries.videos.desc")}
      />
      <section className="bg-cream">
        <div className="mx-auto max-w-5xl px-6 py-16">
          {items.length === 0 ? (
            <p className="text-ink-soft">{t("common.empty")}</p>
          ) : (
            <LibrarySearch
              variant="videos"
              placeholder={t("search.quickPlaceholder")}
              noResultsLabel={t("search.noResults")}
              items={items.map((v) => {
                const id = v.youtubeUrl ? parseYouTubeId(v.youtubeUrl) : null;
                return {
                  slug: v.slug,
                  title: v.title,
                  text: v.summary,
                  image: id ? thumbnailUrl(id) : undefined,
                };
              })}
            />
          )}
        </div>
      </section>
    </>
  );
}
