// A capa de um vídeo no site.
//
// 📌 SHORTS TÊM CAPA FIXA (26/09/2026, pedido do Igor): o YouTube não dá uma
// capa aproveitável para Short (a `hqdefault` sai como um quadro qualquer do
// vídeo vertical, espremido em 16:9). Todo Short usa a arte "Shorts · Pílulas
// de conhecimento" (original em ../brand-originais/). Vídeo longo continua
// com a capa do YouTube.
//
// O que conta como Short: o campo "É um Short" do vídeo no painel. Vazio (os
// vídeos anteriores ao campo) = até 3 minutos, o limite de Short no YouTube;
// os vídeos longos dela têm 45 minutos ou mais.

import { asset } from "@/lib/assetPath";
import { SITE_URL } from "@/lib/seo";
import { thumbnailUrl } from "@/lib/youtube";

export const SHORTS_COVER = "/brand/capa-shorts-pilulas-de-conhecimento.webp";
export const SHORT_MAX_SECONDS = 180;

type VideoLike = { isShort?: boolean | null; durationSeconds?: number | null };

export function isShortVideo(v: VideoLike): boolean {
  if (typeof v.isShort === "boolean") return v.isShort;
  return typeof v.durationSeconds === "number" && v.durationSeconds > 0 && v.durationSeconds <= SHORT_MAX_SECONDS;
}

/** Para `<img src>`: caminho do site (com o basePath) ou a capa do YouTube. */
export function videoCover(videoId: string, v: VideoLike): string {
  return isShortVideo(v) ? asset(SHORTS_COVER) : thumbnailUrl(videoId);
}

/** Para dados estruturados e Open Graph: sempre endereço absoluto. */
export function videoCoverAbsolute(videoId: string, v: VideoLike): string {
  return isShortVideo(v) ? `${SITE_URL}${SHORTS_COVER}` : thumbnailUrl(videoId);
}
