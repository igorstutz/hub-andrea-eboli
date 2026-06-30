import type { NextRequest } from "next/server";
import { parseYouTubeId } from "@/lib/youtube";
import { transcribeAudio } from "@/lib/transcribe";

// Transcrição por ÁUDIO (Whisper) — reserva para vídeos sem legenda. É a etapa
// cara/lenta (baixa o áudio, fatia e chama a OpenAI), por isso fica num endpoint
// próprio, acionado por um botão explícito no Studio.

export const runtime = "nodejs";
export const maxDuration = 300; // segundos (relevante em hospedagem serverless)

export async function POST(req: NextRequest) {
  const secret = process.env.INGEST_API_SECRET;
  if (secret && req.headers.get("x-ingest-secret") !== secret) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let url = "";
  try {
    const body = await req.json();
    url = (body?.url ?? "").toString().trim();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const videoId = parseYouTubeId(url);
  if (!videoId) {
    return Response.json({ error: "invalid_url" }, { status: 400 });
  }

  try {
    const result = await transcribeAudio(videoId);
    return Response.json({
      transcript: result.transcript,
      transcriptLang: result.lang,
      transcriptSource: result.source,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao transcrever o áudio.";
    return Response.json(
      { error: "transcription_failed", message },
      { status: 500 },
    );
  }
}
