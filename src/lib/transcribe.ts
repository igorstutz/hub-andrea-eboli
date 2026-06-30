// Transcrição de vídeos do YouTube (server-side).
//
// Estratégia em duas camadas:
//  1. yt-dlp → legendas (manuais ou automáticas). Grátis, rápido, sem chave.
//     Substitui a antiga raspagem direta de `timedtext`, que o YouTube passou
//     a bloquear (devolve vazio sem um PoToken válido).
//  2. Whisper (OpenAI) → transcrição do ÁUDIO, como reserva para vídeos sem
//     legenda nenhuma. Mais caro e lento; exige OPENAI_API_KEY e ffmpeg.
//
// Requisitos do ambiente:
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

// CAMADA 1 — legendas via yt-dlp. Retorna null quando o vídeo não tem legendas
// nos idiomas pedidos (aí o chamador pode cair para o Whisper).
export async function fetchCaptions(
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
