// Extração de dados de vídeos do YouTube (server-side).
//
// Estratégia:
//  - Metadados básicos via oEmbed (título, autor, thumbnail) — sempre disponível.
//  - Metadados extras (duração, descrição, data) via página `watch`
//    (ytInitialPlayerResponse).
//  - Transcrição via yt-dlp (ver `transcribe.ts`). O YouTube passou a bloquear
//    a raspagem direta de legendas, então delegamos ao yt-dlp, que ainda obtém
//    as legendas (manuais ou automáticas) de forma confiável.
//
// Quando não houver legenda, `transcript` volta vazio e `transcriptAvailable`
// = false; o front oferece a transcrição por áudio (Whisper) como reserva.

import { fetchCaptions } from "./transcribe";

export type Chapter = { startTime: number; title: string };

export type YouTubeData = {
  videoId: string;
  url: string;
  title: string;
  author?: string;
  thumbnail?: string;
  description?: string;
  durationSeconds?: number;
  publishDate?: string;
  chapters: Chapter[];
  transcript: string;
  transcriptAvailable: boolean;
  transcriptLang?: string;
  transcriptSource?: "captions";
  // Indica se a transcrição por áudio (Whisper) está configurada no servidor —
  // o front só oferece esse botão quando há OPENAI_API_KEY.
  audioTranscriptionEnabled: boolean;
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// Aceita watch?v=, youtu.be/, /embed/, /shorts/, /live/ e o próprio ID puro.
export function parseYouTubeId(input: string): string | null {
  const raw = input.trim();
  if (/^[\w-]{11}$/.test(raw)) return raw;

  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return /^[\w-]{11}$/.test(id) ? id : null;
    }

    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;

      const m = u.pathname.match(/\/(embed|shorts|live|v)\/([\w-]{11})/);
      if (m) return m[2];
    }
  } catch {
    // não é URL — segue
  }
  return null;
}

export function canonicalUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function thumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

type PlayerResponse = {
  videoDetails?: {
    title?: string;
    author?: string;
    shortDescription?: string;
    lengthSeconds?: string;
  };
  microformat?: {
    playerMicroformatRenderer?: {
      publishDate?: string;
      uploadDate?: string;
    };
  };
};

// Extrai capítulos dos timestamps na descrição (ex.: "01:23 Identidade").
// Aceita mm:ss e h:mm:ss. Retorna ordenado por tempo.
function parseChapters(description?: string): Chapter[] {
  if (!description) return [];
  const out: Chapter[] = [];
  const re = /(?:^|\n)\s*\(?((?:\d{1,2}:)?\d{1,2}:\d{2})\)?[\s\-–—.]+(.+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(description)) !== null) {
    const parts = m[1].split(":").map(Number);
    let seconds = 0;
    if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    else seconds = parts[0] * 60 + parts[1];
    const title = m[2].trim().replace(/\s+/g, " ").slice(0, 120);
    if (title) out.push({ startTime: seconds, title });
  }
  // Dedup por tempo e ordena.
  const seen = new Set<number>();
  return out
    .filter((c) => (seen.has(c.startTime) ? false : (seen.add(c.startTime), true)))
    .sort((a, b) => a.startTime - b.startTime);
}

async function fetchOEmbed(videoId: string) {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        canonicalUrl(videoId),
      )}&format=json`,
      { headers: { "User-Agent": UA } },
    );
    if (!res.ok) return null;
    return (await res.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
    };
  } catch {
    return null;
  }
}

function extractPlayerResponse(html: string): PlayerResponse | null {
  // Procura `ytInitialPlayerResponse = {...};` na página.
  const marker = "ytInitialPlayerResponse = ";
  const start = html.indexOf(marker);
  if (start === -1) return null;
  let i = start + marker.length;
  // Varre o objeto JSON contando chaves (lida com strings e escapes).
  let depth = 0;
  let inStr = false;
  let esc = false;
  const begin = i;
  for (; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        const json = html.slice(begin, i + 1);
        try {
          return JSON.parse(json) as PlayerResponse;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

export async function fetchYouTubeData(videoId: string): Promise<YouTubeData> {
  const url = canonicalUrl(videoId);

  const oembed = await fetchOEmbed(videoId);

  let player: PlayerResponse | null = null;
  try {
    const res = await fetch(`${url}&hl=pt&bpctr=9999999999&has_verified=1`, {
      headers: {
        "User-Agent": UA,
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        // Pula a tela de consentimento de cookies em alguns países.
        Cookie: "CONSENT=YES+cb; PREF=hl=pt",
      },
    });
    if (res.ok) {
      const html = await res.text();
      player = extractPlayerResponse(html);
    }
  } catch {
    player = null;
  }

  const details = player?.videoDetails;
  const micro = player?.microformat?.playerMicroformatRenderer;
  const description = details?.shortDescription || undefined;

  // Transcrição via yt-dlp (legendas). Degrada com elegância: se o yt-dlp não
  // estiver disponível ou o vídeo não tiver legenda, segue sem transcrição.
  let transcript = "";
  let transcriptLang: string | undefined;
  try {
    const captions = await fetchCaptions(videoId);
    if (captions) {
      transcript = captions.transcript;
      transcriptLang = captions.lang;
    }
  } catch {
    transcript = "";
  }

  return {
    videoId,
    url,
    title: details?.title || oembed?.title || "",
    author: details?.author || oembed?.author_name,
    thumbnail: oembed?.thumbnail_url || thumbnailUrl(videoId),
    description,
    durationSeconds: details?.lengthSeconds
      ? Number(details.lengthSeconds)
      : undefined,
    publishDate: micro?.publishDate || micro?.uploadDate,
    chapters: parseChapters(description),
    transcript,
    transcriptAvailable: transcript.length > 0,
    transcriptLang,
    transcriptSource: transcript.length > 0 ? "captions" : undefined,
    audioTranscriptionEnabled: Boolean(process.env.OPENAI_API_KEY),
  };
}

// ISO 8601 de duração (PT#H#M#S) e formatação humana (ex.: "24 min", "1h 03").
export function formatDurationISO(seconds?: number): string | undefined {
  if (!seconds || seconds <= 0) return undefined;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${s ? `${s}S` : ""}` || "PT0S";
}

export function formatDurationHuman(seconds?: number): string | undefined {
  if (!seconds || seconds <= 0) return undefined;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h) return `${h}h ${String(m).padStart(2, "0")}min`;
  return `${m} min`;
}

export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
