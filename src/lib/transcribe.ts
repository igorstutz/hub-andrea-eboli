// Transcrição de vídeos do YouTube (server-side).
//
// 🔴 O PROVEDOR É ESCOLHIDO POR AMBIENTE (`TRANSCRIPT_PROVIDER`), porque o
// mesmo código roda em dois lugares muito diferentes:
//
//   · "ytdlp" (padrão) — a máquina do Igor, no `npm run dev`. O yt-dlp baixa as
//     legendas (manuais ou automáticas) de graça e sem chave. Funciona porque o
//     IP é RESIDENCIAL.
//   · um serviço de transcrição por HTTP — o serviço Node no cPanel. Medido em
//     09/09/2026 num runner do GitHub (IP de datacenter, o mesmo tipo de IP da
//     hospedagem): o yt-dlp morre em "Sign in to confirm you're not a bot".
//     Não é limitação de plano, é o YouTube barrando datacenter. Por isso no
//     servidor a legenda vem de um serviço que faz a busca por proxy
//     residencial (ver `fetchCaptionsRemote`).
//
// Camadas, na ordem:
//  1. Legendas (yt-dlp ou serviço remoto) — grátis/barato, rápido.
//  2. Whisper (OpenAI) → transcrição do ÁUDIO, reserva para vídeo sem legenda.
//     Baixa o áudio com yt-dlp e fatia com ffmpeg, então SÓ EXISTE onde o
//     provedor é "ytdlp" (ver `whisperAvailable`). No servidor o botão nem
//     aparece.
//
// Requisitos do ambiente local:
//  - yt-dlp acessível (por padrão via `python -m yt_dlp`; configurável em YTDLP_CMD).
//  - ffmpeg no PATH (usado pelo yt-dlp e pelo fatiamento de áudio do Whisper).

import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type TranscriptResult = {
  transcript: string;
  lang?: string;
  source: "captions" | "whisper";
};

// Como invocar o yt-dlp. Em máquinas com o pacote pip instalado, "python -m yt_dlp"
// funciona sem depender do PATH. Quem tiver o binário `yt-dlp` pode definir YTDLP_CMD.
function ytDlpCommand(): { cmd: string; baseArgs: string[] } {
  const raw = (process.env.YTDLP_CMD || "python -m yt_dlp").trim();
  const tokens = raw.split(/\s+/);
  return { cmd: tokens[0], baseArgs: tokens.slice(1) };
}

function canonicalUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

// Executa um binário capturando stdout/stderr. Rejeita só em erro de processo;
// código de saída != 0 volta no objeto para o chamador decidir.
function run(
  cmd: string,
  args: string[],
  opts: { cwd?: string; timeoutMs?: number } = {},
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(
      cmd,
      args,
      {
        cwd: opts.cwd,
        timeout: opts.timeoutMs ?? 0,
        maxBuffer: 64 * 1024 * 1024,
        windowsHide: true,
      },
      (err, stdout, stderr) => {
        if (err && (err as NodeJS.ErrnoException).code === "ENOENT") {
          reject(err);
          return;
        }
        const code =
          err && typeof (err as { code?: unknown }).code === "number"
            ? ((err as { code: number }).code as number)
            : err
              ? 1
              : 0;
        resolve({ code, stdout: stdout ?? "", stderr: stderr ?? "" });
      },
    );
  });
}

type Json3 = { events?: Array<{ segs?: Array<{ utf8?: string }> }> };

// Converte o JSON3 de legenda do YouTube em texto corrido.
function json3ToText(raw: string): string {
  let data: Json3;
  try {
    data = JSON.parse(raw) as Json3;
  } catch {
    return "";
  }
  const parts: string[] = [];
  for (const ev of data.events ?? []) {
    const line = (ev.segs ?? []).map((s) => s.utf8 ?? "").join("");
    const clean = line.replace(/\s+/g, " ").trim();
    if (clean) parts.push(clean);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

// Prioridade de idioma: pt > en > es > qualquer outro.
function langScore(lang: string): number {
  const l = lang.toLowerCase();
  if (l.startsWith("pt")) return 3;
  if (l.startsWith("en")) return 2;
  if (l.startsWith("es")) return 1;
  return 0;
}

// ---------------------------------------------------------------------------
// Escolha do provedor
// ---------------------------------------------------------------------------
export type TranscriptProvider = "ytdlp" | "supadata";

/** Nome normalizado do provedor configurado (padrão: yt-dlp local). */
export function transcriptProviderName(): TranscriptProvider {
  const raw = (process.env.TRANSCRIPT_PROVIDER || "ytdlp").trim().toLowerCase();
  return raw === "supadata" ? "supadata" : "ytdlp";
}

/**
 * O Whisper precisa baixar o ÁUDIO (yt-dlp) e fatiá-lo (ffmpeg). Isso só existe
 * onde o provedor local está configurado — na hospedagem, o yt-dlp não passa
 * do YouTube e os binários nem estão instalados.
 */
export function whisperAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY) && transcriptProviderName() === "ytdlp";
}

// CAMADA 1 — legendas. Retorna null quando o vídeo não tem legendas nos
// idiomas pedidos (aí o chamador pode cair para o Whisper, onde ele existir).
export async function fetchCaptions(
  videoId: string,
): Promise<TranscriptResult | null> {
  switch (transcriptProviderName()) {
    case "supadata":
      return fetchCaptionsRemote(videoId);
    case "ytdlp":
    default:
      return fetchCaptionsYtDlp(videoId);
  }
}

// CAMADA 1a — legendas via yt-dlp (máquina local, IP residencial).
async function fetchCaptionsYtDlp(
  videoId: string,
): Promise<TranscriptResult | null> {
  const { cmd, baseArgs } = ytDlpCommand();
  const dir = await mkdtemp(join(tmpdir(), "yt-cap-"));
  try {
    const args = [
      ...baseArgs,
      "--write-subs",
      "--write-auto-subs",
      "--sub-langs",
      "pt,pt-BR,pt-PT,en,en-US,es,es-419",
      "--sub-format",
      "json3",
      "--skip-download",
      "--no-warnings",
      "-o",
      join(dir, "%(id)s.%(ext)s"),
      canonicalUrl(videoId),
    ];
    await run(cmd, args, { timeoutMs: 90_000 });

    // Arquivos no formato `<id>.<lang>.json3`. Escolhe o de maior prioridade
    // (em empate, o texto mais longo — costuma ser a legenda mais completa).
    const files = (await readdir(dir)).filter((f) => f.endsWith(".json3"));
    let best: { text: string; lang: string } | null = null;
    for (const file of files) {
      const m = file.match(/\.([\w-]+)\.json3$/);
      const lang = m ? m[1] : "";
      const text = json3ToText(await readFile(join(dir, file), "utf8"));
      if (!text) continue;
      if (
        !best ||
        langScore(lang) > langScore(best.lang) ||
        (langScore(lang) === langScore(best.lang) &&
          text.length > best.text.length)
      ) {
        best = { text, lang };
      }
    }
    if (!best) return null;
    return { transcript: best.text, lang: best.lang, source: "captions" };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

// CAMADA 1b — legendas via Supadata (https://supadata.ai), para a hospedagem.
//
// Por que este serviço: devolve a legenda de QUALQUER vídeo público do YouTube
// (inclusive podcasts em que a Andrea é convidada, que a API oficial do YouTube
// com OAuth do canal dela não cobre), tem plano grátis de 100 créditos/mês e o
// menor plano pago custa US$ 5/mês (visto em supadata.ai/pricing em
// 21/09/2026). Uma legenda existente = 1 crédito; o volume esperado do hub
// (5 a 30 vídeos/mês) cabe no grátis.
//
// Doc: https://docs.supadata.ai/get-transcript
//   GET https://api.supadata.ai/v1/transcript?url=…&lang=pt&text=true&mode=native
//   header x-api-key
//   200 → { content: string, lang, availableLangs[] }
//   202 → { jobId } (processamento assíncrono; só acontece com geração por IA)
//   206 → legenda indisponível (cobra 1 crédito mesmo assim)
//   401/402/429 → chave, plano ou cota
//
// ⚠️ `mode=native` de propósito: só busca legenda que JÁ EXISTE (manual ou
// automática do YouTube). Com `auto`, um vídeo sem legenda seria transcrito por
// IA a 2 créditos POR MINUTO — um podcast de 60 min gastaria 120 créditos, mais
// do que o mês inteiro do plano grátis. Quem quiser esse fallback liga
// SUPADATA_MODE=auto sabendo do custo.
const SUPADATA_BASE = "https://api.supadata.ai/v1";
const SUPADATA_POLL_MS = 1500;
const SUPADATA_POLL_MAX_MS = 150_000;

type SupadataResult = {
  content?: string | Array<{ text?: string }>;
  lang?: string;
  availableLangs?: string[];
  jobId?: string;
  status?: "queued" | "active" | "completed" | "failed";
  error?: string;
  message?: string;
  details?: string;
};

function supadataContentToText(content: SupadataResult["content"]): string {
  if (typeof content === "string") return content.replace(/\s+/g, " ").trim();
  if (Array.isArray(content)) {
    return content
      .map((c) => (c.text ?? "").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

async function supadataGet(
  path: string,
  apiKey: string,
): Promise<{ status: number; body: SupadataResult }> {
  const res = await fetch(`${SUPADATA_BASE}${path}`, {
    headers: { "x-api-key": apiKey, Accept: "application/json" },
    signal: AbortSignal.timeout(120_000),
  });
  const body = (await res.json().catch(() => ({}))) as SupadataResult;
  return { status: res.status, body };
}

async function fetchCaptionsRemote(
  videoId: string,
): Promise<TranscriptResult | null> {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) {
    throw new Error(
      "TRANSCRIPT_PROVIDER=supadata exige SUPADATA_API_KEY no ambiente.",
    );
  }
  const mode = process.env.SUPADATA_MODE === "auto" ? "auto" : "native";

  const query = (lang: string) =>
    `/transcript?url=${encodeURIComponent(canonicalUrl(videoId))}&lang=${lang}&text=true&mode=${mode}`;

  let { status, body } = await supadataGet(query("pt"), apiKey);

  // Processamento assíncrono (geração por IA em vídeo longo): espera o job.
  if (status === 202 && body.jobId) {
    const deadline = Date.now() + SUPADATA_POLL_MAX_MS;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, SUPADATA_POLL_MS));
      const job = await supadataGet(`/transcript/${body.jobId}`, apiKey);
      if (job.body.status === "completed") {
        status = 200;
        body = job.body;
        break;
      }
      if (job.body.status === "failed") {
        throw new Error(
          `A transcrição por IA falhou na Supadata: ${job.body.error ?? "sem detalhe"}.`,
        );
      }
    }
    if (status === 202) {
      throw new Error("A Supadata não concluiu a transcrição a tempo. Tente de novo em alguns minutos.");
    }
  }

  if (status === 206 || body.error === "transcript-unavailable") {
    return null; // vídeo sem legenda: o chamador segue sem transcrição
  }
  if (status === 401) throw new Error("A chave da Supadata foi recusada (SUPADATA_API_KEY).");
  if (status === 402) throw new Error("O plano atual da Supadata não cobre esta chamada.");
  if (status === 429) throw new Error("Cota ou limite de requisições da Supadata esgotado neste mês.");
  if (status === 403 || status === 404) {
    throw new Error(
      `A Supadata não conseguiu acessar o vídeo (HTTP ${status}: ${body.details ?? body.message ?? "privado ou restrito"}).`,
    );
  }
  if (status < 200 || status >= 300) {
    throw new Error(`A Supadata respondeu HTTP ${status}${body.message ? `: ${body.message}` : ""}.`);
  }

  // Sem legenda em pt, a Supadata devolve a primeira disponível. Se houver en
  // ou es na lista, vale 1 crédito a mais para vir num idioma que o site fala.
  let lang = body.lang ?? "";
  if (langScore(lang) === 0 && body.availableLangs?.length) {
    const preferred = ["pt", "pt-BR", "en", "es"].find((l) =>
      body.availableLangs!.some((a) => a.toLowerCase() === l.toLowerCase()),
    );
    if (preferred) {
      const again = await supadataGet(query(preferred), apiKey);
      if (again.status === 200) {
        body = again.body;
        lang = body.lang ?? preferred;
      }
    }
  }

  const transcript = supadataContentToText(body.content);
  if (!transcript) return null;
  return { transcript, lang: lang || undefined, source: "captions" };
}

// Metadados do vídeo pela Supadata (1 crédito), usados quando a página `watch`
// do YouTube não responde — em datacenter, sempre; e desde 21/09/2026 também
// no IP residencial do Igor. Sem isto o rascunho do vídeo sairia sem duração,
// data de publicação, descrição e capítulos.
// Doc: https://docs.supadata.ai/api-reference/endpoint/metadata/metadata
//   GET /metadata?url=…  →  { title, description, author.displayName,
//                            media.{duration,thumbnailUrl}, createdAt (ISO) }
// Nunca lança: metadado é acessório, a legenda é o que importa.
export type RemoteVideoMeta = {
  title?: string;
  description?: string;
  author?: string;
  thumbnail?: string;
  durationSeconds?: number;
  publishDate?: string;
};

export async function fetchYouTubeMetadataRemote(
  videoId: string,
): Promise<RemoteVideoMeta | null> {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey || transcriptProviderName() !== "supadata") return null;
  try {
    const res = await fetch(
      `${SUPADATA_BASE}/metadata?url=${encodeURIComponent(canonicalUrl(videoId))}`,
      {
        headers: { "x-api-key": apiKey, Accept: "application/json" },
        signal: AbortSignal.timeout(30_000),
      },
    );
    if (!res.ok) return null;
    const m = (await res.json()) as {
      title?: string | null;
      description?: string | null;
      author?: { displayName?: string; username?: string };
      media?: { type?: string; duration?: number; thumbnailUrl?: string };
      createdAt?: string;
    };
    const duration =
      typeof m.media?.duration === "number" && m.media.duration > 0
        ? Math.round(m.media.duration)
        : undefined;
    return {
      title: m.title || undefined,
      description: m.description || undefined,
      author: m.author?.displayName || m.author?.username || undefined,
      thumbnail: m.media?.thumbnailUrl || undefined,
      durationSeconds: duration,
      publishDate: m.createdAt || undefined,
    };
  } catch {
    return null;
  }
}

const WHISPER_MAX = 12; // teto de fatias de áudio (~3h) — guarda contra abuso.

// Envia uma fatia de áudio ao endpoint de transcrição da OpenAI.
async function whisperChunk(
  filePath: string,
  apiKey: string,
  model: string,
  lang?: string,
): Promise<string> {
  const buf = await readFile(filePath);
  const form = new FormData();
  form.append("file", new Blob([buf]), "audio.mp3");
  form.append("model", model);
  form.append("response_format", "text");
  if (lang) form.append("language", lang);

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Whisper falhou (HTTP ${res.status})${detail ? `: ${detail.slice(0, 300)}` : ""}`,
    );
  }
  return (await res.text()).trim();
}

// CAMADA 2 — transcrição do áudio via Whisper. Baixa o áudio (yt-dlp), normaliza
// para 16 kHz mono e fatia em blocos de 15 min (ffmpeg) para caber no limite de
// 25 MB por requisição, transcreve cada bloco e junta na ordem.
export async function transcribeAudio(
  videoId: string,
): Promise<TranscriptResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY ausente no ambiente.");
  }
  const model = process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1";
  const lang = process.env.OPENAI_TRANSCRIBE_LANG || undefined;

  const { cmd, baseArgs } = ytDlpCommand();
  const dir = await mkdtemp(join(tmpdir(), "yt-aud-"));
  try {
    // 1. Baixa o melhor áudio disponível (sem reencode aqui).
    const dl = await run(
      cmd,
      [
        ...baseArgs,
        "-f",
        "bestaudio/best",
        "--no-warnings",
        "-o",
        join(dir, "src.%(ext)s"),
        canonicalUrl(videoId),
      ],
      { timeoutMs: 600_000 },
    );
    const downloaded = (await readdir(dir)).find((f) => f.startsWith("src."));
    if (!downloaded) {
      throw new Error(
        `Não foi possível baixar o áudio do vídeo.${dl.stderr ? ` ${dl.stderr.slice(-300)}` : ""}`,
      );
    }

    // 2. Normaliza (16 kHz mono, 32 kbps) e fatia em blocos de 15 min.
    const seg = await run(
      "ffmpeg",
      [
        "-i",
        join(dir, downloaded),
        "-ac",
        "1",
        "-ar",
        "16000",
        "-b:a",
        "32k",
        "-f",
        "segment",
        "-segment_time",
        "900",
        "-reset_timestamps",
        "1",
        "-loglevel",
        "error",
        join(dir, "chunk_%03d.mp3"),
      ],
      { timeoutMs: 600_000 },
    );
    const chunks = (await readdir(dir))
      .filter((f) => /^chunk_\d+\.mp3$/.test(f))
      .sort();
    if (!chunks.length) {
      throw new Error(
        `Falha ao processar o áudio com ffmpeg.${seg.stderr ? ` ${seg.stderr.slice(-300)}` : ""}`,
      );
    }
    if (chunks.length > WHISPER_MAX) {
      throw new Error(
        `Áudio longo demais para transcrição automática (${chunks.length} blocos).`,
      );
    }

    // 3. Transcreve cada bloco em sequência e concatena.
    const parts: string[] = [];
    for (const chunk of chunks) {
      const text = await whisperChunk(join(dir, chunk), apiKey, model, lang);
      if (text) parts.push(text);
    }
    const transcript = parts.join(" ").replace(/\s+/g, " ").trim();
    if (!transcript) {
      throw new Error("A transcrição por áudio voltou vazia.");
    }
    return { transcript, lang, source: "whisper" };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
