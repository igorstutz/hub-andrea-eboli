import type { NextRequest } from "next/server";
import { detectSource } from "@/lib/ingest/sources";
import { fetchWebArticle, MIN_USABLE_TEXT } from "@/lib/webArticle";

// Etapa 1 da ingestão para fontes de TEXTO (Forbes, LinkedIn): recebe a URL e
// devolve metadados + o texto extraído da página. Não toca no Sanity e não gasta
// tokens de IA. Quando o veículo barra o robô (403 / muro de login) devolvemos
// status "blocked"/"empty" — a ferramenta do Studio então pede o texto colado.
export async function POST(req: NextRequest) {
  let url = "";
  try {
    const body = await req.json();
    url = (body?.url ?? "").toString().trim();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const source = detectSource(url);
  if (!source) {
    return Response.json({ error: "invalid_url" }, { status: 400 });
  }
  if (source === "youtube") {
    // YouTube tem rota própria (metadados + transcrição).
    return Response.json({ error: "wrong_source" }, { status: 400 });
  }

  const article = await fetchWebArticle(url);
  return Response.json({ source, minUsableText: MIN_USABLE_TEXT, ...article });
}
