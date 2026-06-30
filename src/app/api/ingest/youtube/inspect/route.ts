import type { NextRequest } from "next/server";
import { fetchYouTubeData, parseYouTubeId } from "@/lib/youtube";

// Etapa 1 da ingestão: recebe a URL do YouTube e devolve metadados + transcrição.
// Não toca no Sanity e não gasta tokens de IA — é só leitura do vídeo.
export async function POST(req: NextRequest) {
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
    const data = await fetchYouTubeData(videoId);
    if (!data.title) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    return Response.json(data);
  } catch {
    return Response.json({ error: "fetch_failed" }, { status: 502 });
  }
}
