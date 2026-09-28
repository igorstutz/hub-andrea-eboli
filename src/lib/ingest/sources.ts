// Fontes de conteúdo aceitas na ingestão e o que cada uma pode gerar.
// Módulo PURO (sem Node/fetch): é importado tanto pelas rotas de API quanto
// pela ferramenta do Studio (bundle de navegador).

// `web` = qualquer outro site (28/09/2026). Não gera conteúdo: serve só para
// pôr o link em "Na mídia" como menção (a Andrea é citada por vários sites).
export type ContentSource = "youtube" | "forbes" | "linkedin" | "web";

/** Tipos de conteúdo que a ingestão por link sabe gerar. */
export type IngestTarget = "video" | "questions" | "article";

export const SOURCE_LABEL: Record<ContentSource, string> = {
  youtube: "YouTube",
  forbes: "Forbes",
  linkedin: "LinkedIn",
  web: "outro site",
};

// REGRA DO PROJETO (06/08/2026) — cada fonte gera os seus tipos:
// · YouTube  → vídeo/podcast + perguntas + artigo
// · Forbes   → perguntas + artigo
// · LinkedIn → perguntas + artigo
// CONCEITOS não são gerados por link em NENHUMA fonte: entram à mão no Studio.
export const SOURCE_TARGETS: Record<ContentSource, IngestTarget[]> = {
  youtube: ["video", "questions", "article"],
  forbes: ["questions", "article"],
  linkedin: ["questions", "article"],
  web: [],
};

/** Fontes cujo material é um texto já publicado (e não uma transcrição). */
export const PUBLISHED_TEXT_SOURCES: ContentSource[] = ["forbes", "linkedin"];

const YOUTUBE_HOSTS = /(^|\.)(youtube\.com|youtube-nocookie\.com|youtu\.be)$/;
const FORBES_HOSTS = /(^|\.)forbes\.[a-z]{2,}(\.[a-z]{2,})?$/;
const LINKEDIN_HOSTS = /(^|\.)(linkedin\.com|lnkd\.in)$/;

/** Descobre a fonte pelo domínio. null = não é um link http(s). */
export function detectSource(url: string): ContentSource | null {
  let host: string;
  try {
    host = new URL(url.trim()).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (YOUTUBE_HOSTS.test(host)) return "youtube";
  if (FORBES_HOSTS.test(host)) return "forbes";
  if (LINKEDIN_HOSTS.test(host)) return "linkedin";
  return /^https?:$/.test(new URL(url.trim()).protocol) ? "web" : null;
}

export function sourceAllows(source: ContentSource, target: IngestTarget): boolean {
  return SOURCE_TARGETS[source].includes(target);
}

/** Alvos padrão marcados ao abrir a ferramenta, por fonte. */
export function defaultTargets(source: ContentSource): Record<IngestTarget, boolean> {
  return {
    video: sourceAllows(source, "video"),
    questions: sourceAllows(source, "questions"),
    // fontes de texto já vêm com artigo
    article: sourceAllows(source, "article") && !sourceAllows(source, "video"),
  };
}
