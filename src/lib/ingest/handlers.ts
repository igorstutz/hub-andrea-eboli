// As rotas da ingestão, em forma neutra: `(Request) => Promise<Response>`.
//
// 🔴 POR QUE ISTO NÃO MORA EM src/app/api:
// O mesmo código tem DOIS servidores. No `npm run dev` são as rotas do Next
// (src/app/api/ingest/*, que só re-exportam daqui). No ar é o serviço Node do
// cPanel (servidor-ingest/app.ts → dist-api/app.js), porque o site é estático
// e a hospedagem só roda Node pelo "Setup Node.js App". Os dois falam Request e
// Response do padrão web, então a lógica é escrita UMA vez aqui e cada servidor
// só adapta a entrada e a saída. Nada aqui pode importar de "next/*".
//
// Todas as rotas que trabalham (inspecionar, transcrever, gerar) exigem sessão
// de membro do projeto (ver ./auth.ts). A única aberta é /ingest/health, que
// não revela segredo nenhum e existe para o painel e para o Igor saberem se o
// serviço está de pé.

import { randomUUID } from "node:crypto";
import { createClient } from "@sanity/client";
import {
  generateContent,
  type AiSettings,
  type Counts,
  type GeneratedContent,
  type HubConcept,
  type Targets,
} from "@/lib/ai/generate";
import {
  markdownToPortableText,
  slugify,
  textToPortableText,
  type PortableBlock,
} from "@/lib/portableText";
import {
  detectSource,
  sourceAllows,
  type ContentSource,
  type IngestTarget,
} from "@/lib/ingest/sources";
import { authFailure, requireMember } from "@/lib/ingest/auth";
import { fetchWebArticle, MIN_USABLE_TEXT } from "@/lib/webArticle";
import { fetchYouTubeData, parseYouTubeId } from "@/lib/youtube";
import {
  transcribeAudio,
  transcriptProviderName,
  whisperAvailable,
} from "@/lib/transcribe";
import { apiVersion, dataset, projectId } from "@/sanity/env";

export type Handler = (req: Request) => Promise<Response>;

// Cliente de leitura SEM CDN: garante que mudanças no painel "Agentes de IA"
// (após Publicar) sejam refletidas na hora, sem cache.
const readClient = createClient({ projectId, dataset, apiVersion, useCdn: false });

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// GET /ingest/health — sem autenticação, sem segredo
// ---------------------------------------------------------------------------
export const handleHealth: Handler = async () =>
  json({
    ok: true,
    service: "ingest",
    build: process.env.INGEST_BUILD || "dev",
    node: process.version,
    // Só a PRESENÇA das chaves, nunca o valor.
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    transcript: {
      provider: transcriptProviderName(),
      whisper: whisperAvailable(),
    },
    sanity: { projectId, dataset },
  });

// ---------------------------------------------------------------------------
// POST /ingest/youtube/inspect — metadados + transcrição (etapa 1, YouTube)
// ---------------------------------------------------------------------------
export const handleYouTubeInspect: Handler = async (req) => {
  const auth = await requireMember(req);
  if (!auth.ok) return authFailure(auth);

  const body = await readJson<{ url?: string }>(req);
  if (!body) return json({ error: "bad_request" }, 400);
  const url = (body.url ?? "").toString().trim();

  const videoId = parseYouTubeId(url);
  if (!videoId) return json({ error: "invalid_url" }, 400);

  try {
    const data = await fetchYouTubeData(videoId);
    if (!data.title) return json({ error: "not_found" }, 404);
    return json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : undefined;
    return json({ error: "fetch_failed", message }, 502);
  }
};

// ---------------------------------------------------------------------------
// POST /ingest/web/inspect — texto do artigo (etapa 1, Forbes/LinkedIn)
// ---------------------------------------------------------------------------
// Não toca no Sanity e não gasta tokens de IA. Quando o veículo barra o robô
// (403 / muro de login) devolvemos status "blocked"/"empty" — a ferramenta do
// Studio então pede o texto colado.
export const handleWebInspect: Handler = async (req) => {
  const auth = await requireMember(req);
  if (!auth.ok) return authFailure(auth);

  const body = await readJson<{ url?: string }>(req);
  if (!body) return json({ error: "bad_request" }, 400);
  const url = (body.url ?? "").toString().trim();

  const source = detectSource(url);
  if (!source) return json({ error: "invalid_url" }, 400);
  if (source === "youtube") return json({ error: "wrong_source" }, 400);

  const article = await fetchWebArticle(url);
  return json({ source, minUsableText: MIN_USABLE_TEXT, ...article });
};

// ---------------------------------------------------------------------------
// POST /ingest/youtube/transcribe — transcrição por ÁUDIO (Whisper)
// ---------------------------------------------------------------------------
// Reserva para vídeos sem legenda. É a etapa cara/lenta (baixa o áudio, fatia
// e chama a OpenAI), por isso fica num endpoint próprio, acionado por um botão
// explícito no Studio. Só existe onde há yt-dlp + ffmpeg (a máquina do Igor).
export const handleTranscribe: Handler = async (req) => {
  const auth = await requireMember(req);
  if (!auth.ok) return authFailure(auth);

  if (!whisperAvailable()) {
    return json(
      {
        error: "not_available",
        message:
          "A transcrição por áudio não está disponível neste servidor (exige yt-dlp e ffmpeg).",
      },
      501,
    );
  }

  const body = await readJson<{ url?: string }>(req);
  if (!body) return json({ error: "bad_request" }, 400);
  const url = (body.url ?? "").toString().trim();

  const videoId = parseYouTubeId(url);
  if (!videoId) return json({ error: "invalid_url" }, 400);

  try {
    const result = await transcribeAudio(videoId);
    return json({
      transcript: result.transcript,
      transcriptLang: result.lang,
      transcriptSource: result.source,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao transcrever o áudio.";
    return json({ error: "transcription_failed", message }, 500);
  }
};

// ---------------------------------------------------------------------------
// POST /ingest/generate — etapa 2, comum às 3 fontes
// ---------------------------------------------------------------------------
// Gera o conteúdo com o Claude e monta documentos do Sanity prontos para serem
// criados como RASCUNHO. A gravação em si acontece no Studio, pela sessão
// autenticada da própria editora (não usamos token de escrita aqui).
//
// O que cada fonte pode gerar está em src/lib/ingest/sources.ts e é conferido
// aqui também (o cliente esconde as opções; o servidor não confia nele).
// CONCEITOS não são gerados por link em nenhuma fonte.

type SettingsWithDefaults = AiSettings & {
  defaultQuestionsCount?: number;
};

async function readAiSettings(): Promise<SettingsWithDefaults | null> {
  try {
    return await readClient.fetch<SettingsWithDefaults | null>(
      `*[_id == "aiSettings"][0]{
        voice, videoInstructions, faqInstructions,
        articleInstructions, conceptLinkingInstructions, model, effort,
        defaultQuestionsCount
      }`,
    );
  } catch {
    return null; // sem configuração → usa padrões embutidos
  }
}

// Conceitos-pilar PUBLICADOS do hub: candidatos ao vínculo automático
// (relatedConcepts) de cada conteúdo gerado.
async function readHubConcepts(): Promise<HubConcept[]> {
  try {
    return await readClient.fetch<HubConcept[]>(
      `*[_type == "concept" && !(_id in path("drafts.**")) && defined(slug.current)] | order(title.pt asc){
        "id": _id,
        "title": title.pt,
        "definition": shortDefinition.pt
      }`,
    );
  } catch {
    return []; // sem conceitos → gera sem vinculação
  }
}

type Loc = { pt: string; en: string; es: string };
type LocaleBlock = { pt: PortableBlock[]; en: PortableBlock[]; es: PortableBlock[] };

type SanityDoc = Record<string, unknown> & { _id: string; _type: string };
type ResultDoc = { _id: string; _type: string; label: string; doc: SanityDoc };

function shortId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 5);
}

// Gerador de slugs LIMPOS: usa o título puro e só acrescenta sufixo aleatório
// quando o slug já existe no Sanity (mesmo tipo) ou já foi usado neste lote.
// `taken` null = não foi possível consultar os slugs existentes → sufixo sempre
// (comportamento antigo, garante unicidade sem depender da consulta).
type SlugFor = (ptTitle: string, type: string) => { _type: "slug"; current: string };

function makeSlugFactory(taken: Set<string> | null): SlugFor {
  return (ptTitle, type) => {
    const base = slugify(ptTitle) || "video";
    if (!taken) return { _type: "slug", current: `${base}-${shortId()}` };
    const key = `${type}:${base}`;
    const current = taken.has(key) ? `${base}-${shortId()}` : base;
    taken.add(`${type}:${current}`);
    return { _type: "slug", current };
  };
}

// Slugs já usados no dataset (publicados), por tipo. null em caso de falha.
async function readTakenSlugs(): Promise<Set<string> | null> {
  try {
    const rows = await readClient.fetch<Array<{ _type: string; slug: string }>>(
      `*[_type in ["question", "concept", "article", "video"] && defined(slug.current)]{ _type, "slug": slug.current }`,
    );
    return new Set(rows.map((r) => `${r._type}:${r.slug}`));
  } catch {
    return null;
  }
}

function locBlock(md: Loc): LocaleBlock {
  return {
    pt: markdownToPortableText(md.pt),
    en: markdownToPortableText(md.en),
    es: markdownToPortableText(md.es),
  };
}

function seo(title: Loc, description?: Loc) {
  return {
    _type: "seo",
    metaTitle: title,
    ...(description ? { metaDescription: description } : {}),
  };
}

// Em qual idioma guardar a transcrição (vai inteira em um só campo do localeBlock).
function transcriptBucket(lang?: string): "pt" | "en" | "es" {
  const l = (lang || "").toLowerCase();
  if (l.startsWith("en")) return "en";
  if (l.startsWith("es")) return "es";
  return "pt";
}

type Chapter = { startTime: number; title: string };

type BuildCtx = {
  source: ContentSource;
  url: string;
  /** Transcrição (YouTube) ou texto do artigo de origem (Forbes/LinkedIn). */
  material: string;
  transcriptLang?: string;
  durationSeconds?: number;
  publishDate?: string;
  chapters?: Chapter[];
  // Ids de conceitos-pilar válidos (protege contra ids fora da lista).
  hubConceptIds?: Set<string>;
  // Gerador de slugs (limpos, com sufixo só em colisão).
  slugFor: SlugFor;
};

// Referência do Sanity para o id base (sem o prefixo drafts.).
// IMPORTANTE: `_weak: true`. Como tudo é criado como RASCUNHO, os documentos
// publicados ainda não existem; uma referência forte para um id publicado
// inexistente faz a gravação falhar. A referência fraca grava sem exigir o
// alvo e passa a resolver naturalmente quando a editora publicar os itens.
function ref(id: string) {
  return {
    _type: "reference" as const,
    _key: shortId(),
    _ref: id.replace(/^drafts\./, ""),
    _weak: true,
  };
}

function buildDocuments(gen: GeneratedContent, ctx: BuildCtx): ResultDoc[] {
  const questions: ResultDoc[] = [];
  let article: ResultDoc | null = null;
  let video: ResultDoc | null = null;

  // Converte os ids escolhidos pela IA em referências, descartando qualquer id
  // que não esteja na lista real de conceitos do hub.
  const pillarRefs = (ids?: string[]) =>
    (ids ?? [])
      .filter((id) => ctx.hubConceptIds?.has(id))
      .map((id) => ref(id));

  for (const q of gen.questions ?? []) {
    const id = `drafts.${randomUUID()}`;
    const conceptRefs = pillarRefs(q.relatedConceptIds);
    questions.push({
      _id: id,
      _type: "question",
      label: q.title.pt,
      doc: {
        _id: id,
        _type: "question",
        title: q.title,
        slug: ctx.slugFor(q.title.pt, "question"),
        experience: q.experience,
        answer: q.answer,
        body: locBlock(q.body),
        ...(conceptRefs.length ? { relatedConcepts: conceptRefs } : {}),
        seo: seo(q.title, q.answer),
      },
    });
  }

  if (gen.article) {
    const id = `drafts.${randomUUID()}`;
    const conceptRefs = pillarRefs(gen.article.relatedConceptIds);
    article = {
      _id: id,
      _type: "article",
      label: gen.article.title.pt,
      doc: {
        _id: id,
        _type: "article",
        title: gen.article.title,
        slug: ctx.slugFor(gen.article.title.pt, "article"),
        kind: "article",
        // Fonte do material — vira o filtro por "categoria" na biblioteca.
        source: ctx.source,
        sourceUrl: ctx.url,
        excerpt: gen.article.excerpt,
        body: locBlock(gen.article.body),
        publishedAt: ctx.publishDate
          ? new Date(ctx.publishDate).toISOString()
          : new Date().toISOString(),
        ...(conceptRefs.length ? { relatedConcepts: conceptRefs } : {}),
        seo: seo(gen.article.title, gen.article.excerpt),
      },
    };
  }

  if (gen.video) {
    const id = `drafts.${randomUUID()}`;
    // Conceitos do vídeo: só os pilares escolhidos pela IA (conceitos não são
    // mais gerados por link).
    const videoConceptRefs = pillarRefs(gen.video.relatedConceptIds);
    const transcriptBlocks = textToPortableText(ctx.material);
    const bucket = transcriptBucket(ctx.transcriptLang);
    const transcript: LocaleBlock = {
      pt: bucket === "pt" ? transcriptBlocks : [],
      en: bucket === "en" ? transcriptBlocks : [],
      es: bucket === "es" ? transcriptBlocks : [],
    };
    const chapters = (ctx.chapters ?? []).map((c) => ({
      _key: shortId(),
      _type: "chapter",
      startTime: c.startTime,
      title: c.title,
    }));

    video = {
      _id: id,
      _type: "video",
      label: gen.video.title.pt,
      doc: {
        _id: id,
        _type: "video",
        title: gen.video.title,
        slug: ctx.slugFor(gen.video.title.pt, "video"),
        youtubeUrl: ctx.url,
        ...(ctx.publishDate
          ? { publishedAt: new Date(ctx.publishDate).toISOString() }
          : {}),
        ...(ctx.durationSeconds ? { durationSeconds: ctx.durationSeconds } : {}),
        directAnswer: gen.video.directAnswer,
        summary: gen.video.summary,
        keyTakeaways: locBlock(gen.video.keyTakeaways),
        ...(chapters.length ? { chapters } : {}),
        transcript,
        // Linka automaticamente o que foi gerado no mesmo lote.
        ...(questions.length
          ? { relatedQuestions: questions.map((q) => ref(q._id)) }
          : {}),
        ...(videoConceptRefs.length
          ? { relatedConcepts: videoConceptRefs }
          : {}),
        seo: seo(gen.video.title, gen.video.directAnswer),
      },
    };
  }

  // Ordem de exibição.
  return [...(video ? [video] : []), ...questions, ...(article ? [article] : [])];
}

type GeneratePayload = {
  url?: string;
  material?: string;
  transcriptLang?: string;
  publishDate?: string;
  chapters?: Chapter[];
  meta?: {
    title?: string;
    author?: string;
    description?: string;
    durationSeconds?: number;
  };
  targets?: Targets;
  counts?: Counts;
  directions?: string;
};

export const handleGenerate: Handler = async (req) => {
  const auth = await requireMember(req);
  if (!auth.ok) return authFailure(auth);

  const payload = await readJson<GeneratePayload>(req);
  if (!payload) return json({ error: "bad_request" }, 400);

  const url = (payload.url ?? "").toString().trim();
  const source = detectSource(url);
  if (!url || !source) return json({ error: "invalid_url" }, 400);

  // Só os alvos permitidos para a fonte (o cliente já esconde, aqui é a guarda).
  const requested = payload.targets ?? {};
  const targets: Targets = {};
  const rejected: IngestTarget[] = [];
  for (const key of ["video", "questions", "article"] as IngestTarget[]) {
    if (!requested[key]) continue;
    if (sourceAllows(source, key)) targets[key] = true;
    else rejected.push(key);
  }
  if (!targets.video && !targets.questions && !targets.article) {
    return json(
      {
        error: "no_valid_target",
        message: rejected.length
          ? `Esta fonte (${source}) não gera: ${rejected.join(", ")}.`
          : "Escolha ao menos um tipo de conteúdo.",
      },
      400,
    );
  }

  const material = (payload.material ?? "").toString();

  // Configuração do painel (singleton aiSettings) + conceitos-pilar do hub
  // + slugs já usados (para gerar slugs limpos sem colisão).
  const [settings, hubConcepts, takenSlugs] = await Promise.all([
    readAiSettings(),
    readHubConcepts(),
    readTakenSlugs(),
  ]);
  const counts: Counts = {
    questions:
      payload.counts?.questions ?? settings?.defaultQuestionsCount ?? 5,
  };

  try {
    const gen = await generateContent({
      source,
      meta: { ...payload.meta, url },
      material,
      targets,
      counts,
      settings: settings ?? undefined,
      directions: payload.directions,
      hubConcepts,
    });

    const documents = buildDocuments(gen, {
      source,
      url,
      material,
      transcriptLang: payload.transcriptLang,
      durationSeconds: payload.meta?.durationSeconds,
      publishDate: payload.publishDate,
      chapters: payload.chapters,
      hubConceptIds: new Set(hubConcepts.map((c) => c.id)),
      slugFor: makeSlugFactory(takenSlugs),
    });

    return json({ documents });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao gerar conteúdo.";
    return json({ error: "generation_failed", message }, 500);
  }
};
