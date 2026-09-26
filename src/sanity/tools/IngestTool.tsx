import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useClient, useWorkspace } from "sanity";
import { api, apiHeaders } from "./serviceApi";
import {
  SOURCE_LABEL,
  SOURCE_TARGETS,
  defaultTargets,
  detectSource,
  type ContentSource,
  type IngestTarget,
} from "@/lib/ingest/sources";

// Ferramenta "Importar de link": cola-se um link do YouTube, da Forbes ou do
// LinkedIn e o sistema gera rascunhos trilíngues do que aquela fonte permite.
//   · YouTube  → vídeo/podcast + perguntas + artigo (material = transcrição)
//   · Forbes   → perguntas + artigo (material = texto do artigo publicado)
//   · LinkedIn → perguntas + artigo (idem)
// Conceitos não são gerados por link — entram à mão no Studio.
//
// Fontes de TEXTO costumam barrar robô (403) ou devolver muro de login; por isso
// o texto extraído aparece num campo EDITÁVEL, que a editora pode colar/corrigir.
//
// ONDE ESTÁ O SERVIÇO. No `npm run dev` são as rotas do Next em /api. No painel
// publicado (andreaeboli.com/admin) é o serviço Node do cPanel, montado no
// MESMO domínio em /api — por isso o padrão é um caminho relativo, sem CORS.
// O `build-painel.mjs` grava a variável no bundle (só as SANITY_STUDIO_* passam
// pelo Vite da Sanity); no build do Next ela não existe e vale o padrão.
//
// COMO A FERRAMENTA SE AUTENTICA. Não há segredo no navegador. Ela repassa ao
// serviço o token de sessão que o próprio Studio já usa (`client.config().token`;
// a Sanity o guarda no localStorage depois do login), e o serviço pergunta à
// Sanity quem é o dono do token (ver src/lib/ingest/auth.ts).

const API_VERSION = "2024-10-01";
// Mensagem para os erros que o serviço devolve de forma padronizada.
function authMessage(status: number, data: { message?: string } | null): string | null {
  if (status === 401) {
    return "Sua sessão no painel não foi reconhecida pelo serviço. Saia e entre de novo no painel.";
  }
  if (status === 403) {
    return data?.message || "Seu papel neste projeto não pode importar conteúdo.";
  }
  if (status === 503) {
    return data?.message || "O serviço não conseguiu confirmar sua sessão. Tente de novo.";
  }
  return null;
}

type ServiceHealth = {
  ok: boolean;
  build?: string;
  anthropic?: boolean;
  transcript?: { provider?: string; whisper?: boolean };
};

type ServiceState =
  | { status: "checking" }
  | { status: "online"; health: ServiceHealth }
  | { status: "offline"; detail: string };

type Chapter = { startTime: number; title: string };

type YouTubeData = {
  videoId: string;
  url: string;
  title: string;
  author?: string;
  thumbnail?: string;
  description?: string;
  durationSeconds?: number;
  publishDate?: string;
  chapters?: Chapter[];
  transcript: string;
  transcriptAvailable: boolean;
  transcriptLang?: string;
  transcriptSource?: "captions" | "whisper";
  audioTranscriptionEnabled: boolean;
};

type WebData = {
  source: ContentSource;
  url: string;
  title?: string;
  author?: string;
  description?: string;
  publishDate?: string;
  text: string;
  status: "ok" | "empty" | "blocked";
  httpStatus?: number;
  minUsableText: number;
};

type GeneratedDoc = {
  _id: string;
  _type: string;
  label: string;
  doc: Record<string, unknown> & { _id: string; _type: string };
};

type CreatedItem = { id: string; type: string; label: string };

const TYPE_LABEL: Record<string, string> = {
  video: "Vídeo",
  question: "Pergunta",
  article: "Artigo",
};

const TARGET_LABEL: Record<IngestTarget, string> = {
  questions: "FAQ — Perguntas e respostas",
  article: "Artigo",
  video: "Resumo + vídeo (página de vídeo)",
};

// Link para abrir um rascunho no editor. O `basePath` vem do workspace
// ("/admin" tanto no dev quanto no painel publicado) — antes estava fixo em
// "/studio", caminho que deixou de existir em 09/09/2026.
function intentHref(basePath: string, id: string, type: string): string {
  const baseId = id.replace(/^drafts\./, "");
  return `${basePath.replace(/\/+$/, "")}/intent/edit/id=${baseId};type=${type}/`;
}

// Estilos inline (evita dependência de @sanity/ui).
const s: Record<string, CSSProperties> = {
  wrap: { maxWidth: 760, margin: "0 auto", padding: 24, color: "#1a1a1a" },
  card: {
    background: "#fff",
    border: "1px solid #e2e2e6",
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  },
  label: { fontSize: 13, fontWeight: 600, marginBottom: 10 },
  input: {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #cfcfd6",
    borderRadius: 6,
    fontSize: 14,
    boxSizing: "border-box",
  },
  btn: {
    padding: "9px 18px",
    border: "none",
    borderRadius: 6,
    background: "#2276fc",
    color: "#fff",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  btnDisabled: { opacity: 0.5, cursor: "not-allowed" },
  row: { display: "flex", gap: 8, alignItems: "center" },
  muted: { color: "#6b6b72", fontSize: 13 },
  badge: {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  },
  error: {
    background: "#fdecec",
    color: "#b3261e",
    border: "1px solid #f5c2c0",
    borderRadius: 6,
    padding: 12,
    fontSize: 13,
  },
  warn: {
    background: "#fff4e5",
    color: "#8a5000",
    border: "1px solid #f6dcb0",
    borderRadius: 6,
    padding: 12,
    fontSize: 13,
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 0",
  },
  ok: { background: "#e6f4ea", color: "#1e7e34" },
  sourceBadge: { background: "#eef2ff", color: "#3b4cca" },
};

export default function IngestTool() {
  const client = useClient({ apiVersion: API_VERSION });
  const { basePath } = useWorkspace();

  // O serviço está de pé? Uma sondagem ao abrir a ferramenta, para a Andrea
  // ver o motivo na tela quando algo estiver fora (e não um "Falha de rede").
  const [service, setService] = useState<ServiceState>({ status: "checking" });
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    fetch(api("/ingest/health"), { signal: controller.signal })
      .then(async (res) => {
        const health = (await res.json().catch(() => null)) as ServiceHealth | null;
        if (!active) return;
        if (res.ok && health?.ok) setService({ status: "online", health });
        else setService({ status: "offline", detail: `HTTP ${res.status}` });
      })
      .catch(() => {
        if (active) setService({ status: "offline", detail: "sem resposta" });
      })
      .finally(() => clearTimeout(timer));
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const [url, setUrl] = useState("");
  const [inspecting, setInspecting] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);

  const [source, setSource] = useState<ContentSource | null>(null);
  const [yt, setYt] = useState<YouTubeData | null>(null);
  const [web, setWeb] = useState<WebData | null>(null);
  // Material que a IA vai usar: transcrição (YouTube) ou texto do artigo
  // (Forbes/LinkedIn) — neste caso editável pela editora.
  const [material, setMaterial] = useState("");

  const [targets, setTargets] = useState<Record<IngestTarget, boolean>>({
    video: true,
    questions: true,
    article: false,
  });
  const [questionsCount, setQuestionsCount] = useState(5);
  // O artigo gerado também entra na página "Na mídia"? Pergunta obrigatória
  // quando o alvo "Artigo" está marcado (26/09/2026): antes todo artigo da
  // Forbes/LinkedIn entrava lá sem escolha. null = ainda não respondeu.
  const [inMedia, setInMedia] = useState<boolean | null>(null);
  const [directions, setDirections] = useState("");

  // Pré-carrega a quantidade padrão definida no painel "Agentes de IA".
  useEffect(() => {
    let active = true;
    client
      .fetch<{ q?: number } | null>(
        `*[_id == "aiSettings"][0]{"q": defaultQuestionsCount}`,
      )
      .then((cfg) => {
        if (!active || !cfg) return;
        if (typeof cfg.q === "number") setQuestionsCount(cfg.q);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [client]);

  const [generating, setGenerating] = useState(false);
  const [generateElapsed, setGenerateElapsed] = useState(0);
  const [created, setCreated] = useState<CreatedItem[]>([]);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [transcribing, setTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  const handleInspect = useCallback(async () => {
    const detected = detectSource(url);
    setInspectError(null);
    setYt(null);
    setWeb(null);
    setMaterial("");
    setSource(detected);
    setCreated([]);
    setGenerateError(null);
    setTranscribeError(null);

    if (!detected) {
      setInspectError(
        "Link não suportado. Aceito links do YouTube, da Forbes e do LinkedIn.",
      );
      return;
    }

    setTargets(defaultTargets(detected));
    setInMedia(null);
    setInspecting(true);
    try {
      const endpoint =
        detected === "youtube"
          ? api("/ingest/youtube/inspect")
          : api("/ingest/web/inspect");
      const res = await fetch(endpoint, {
        method: "POST",
        headers: apiHeaders(client),
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setInspectError(
          authMessage(res.status, data) ??
            (data?.error === "invalid_url"
              ? "Link inválido."
              : data?.error === "not_found"
                ? "Conteúdo não encontrado."
                : data?.message
                  ? `Não foi possível ler este link: ${data.message}`
                  : "Não foi possível ler este link."),
        );
        return;
      }
      if (detected === "youtube") {
        const d = data as YouTubeData;
        setYt(d);
        setMaterial(d.transcript ?? "");
      } else {
        const d = data as WebData;
        setWeb(d);
        setMaterial(d.text ?? "");
      }
    } catch {
      setInspectError("Falha de rede ao ler o link.");
    } finally {
      setInspecting(false);
    }
  }, [client, url]);

  // Limpa tudo para começar uma nova importação do zero.
  const handleReset = useCallback(() => {
    setUrl("");
    setSource(null);
    setYt(null);
    setWeb(null);
    setMaterial("");
    setInspectError(null);
    setDirections("");
    setCreated([]);
    setGenerateError(null);
    setTranscribeError(null);
    setTargets({ video: true, questions: true, article: false });
    setInMedia(null);
  }, []);

  const handleTranscribeAudio = useCallback(async () => {
    if (!yt) return;
    setTranscribing(true);
    setTranscribeError(null);
    try {
      const res = await fetch(api("/ingest/youtube/transcribe"), {
        method: "POST",
        headers: apiHeaders(client),
        body: JSON.stringify({ url: yt.url }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setTranscribeError(
          authMessage(res.status, data) ??
            data?.message ??
            "Falha ao transcrever o áudio. Tente de novo.",
        );
        return;
      }
      // Injeta a transcrição obtida no material, para a geração usá-la.
      setMaterial(data.transcript ?? "");
      setYt((prev) =>
        prev
          ? {
              ...prev,
              transcript: data.transcript ?? "",
              transcriptLang: data.transcriptLang ?? prev.transcriptLang,
              transcriptAvailable: Boolean(data.transcript),
              transcriptSource: "whisper",
            }
          : prev,
      );
    } catch {
      setTranscribeError("Falha de rede ao transcrever o áudio.");
    } finally {
      setTranscribing(false);
    }
  }, [client, yt]);

  const handleGenerate = useCallback(async () => {
    if (!source) return;
    setGenerating(true);
    setGenerateElapsed(0);
    setGenerateError(null);
    setCreated([]);
    try {
      const res = await fetch(api("/ingest/generate"), {
        method: "POST",
        headers: apiHeaders(client),
        body: JSON.stringify({
          url: yt?.url ?? web?.url ?? url.trim(),
          material,
          transcriptLang: yt?.transcriptLang,
          publishDate: yt?.publishDate ?? web?.publishDate,
          chapters: yt?.chapters,
          meta: {
            title: yt?.title ?? web?.title,
            author: yt?.author ?? web?.author,
            description: yt?.description ?? web?.description,
            durationSeconds: yt?.durationSeconds,
          },
          targets,
          counts: { questions: questionsCount },
          directions: directions.trim() || undefined,
        }),
      });
      const first = await res.json().catch(() => null);
      if (!res.ok) {
        setGenerateError(
          authMessage(res.status, first) ??
            first?.message ??
            "Falha ao gerar o conteúdo. Tente de novo.",
        );
        return;
      }

      // A geração é um JOB: o serviço responde 202 com um id na hora e o
      // Claude escreve em segundo plano; aqui se consulta o resultado a cada
      // 3 s. Motivo: a hospedagem (LiteSpeed) corta qualquer requisição que
      // passe de ~120 s, e uma geração leva de 1 a 4 minutos (medido em
      // 21/09/2026: "500 Request Timeout" aos 121 s).
      let data = first;
      if (res.status === 202 && first?.jobId) {
        const started = Date.now();
        const deadline = started + 15 * 60 * 1000;
        for (;;) {
          await new Promise((r) => setTimeout(r, 3000));
          setGenerateElapsed(Math.round((Date.now() - started) / 1000));
          const poll = await fetch(api(`/ingest/generate/${first.jobId}`), {
            headers: apiHeaders(client),
          });
          const state = await poll.json().catch(() => null);
          if (!poll.ok) {
            setGenerateError(
              authMessage(poll.status, state) ??
                state?.message ??
                "Perdi o contato com a geração. Tente de novo.",
            );
            return;
          }
          if (state?.status === "completed") {
            data = state;
            break;
          }
          if (state?.status === "failed") {
            setGenerateError(
              state.message || "Falha ao gerar o conteúdo. Tente de novo.",
            );
            return;
          }
          if (Date.now() > deadline) {
            setGenerateError(
              "A geração passou de 15 minutos sem terminar. Tente de novo.",
            );
            return;
          }
        }
      }

      // Grava todos os rascunhos numa ÚNICA transação, pela sessão autenticada
      // do Studio. Transação = atômico (tudo ou nada) e mais rápido. As
      // referências entre os documentos são fracas (ver backend), então a ordem
      // não importa e nada falha por alvo ainda inexistente.
      const docs = (data?.documents ?? []) as GeneratedDoc[];
      try {
        const tx = client.transaction();
        for (const entry of docs) {
          // A escolha "Aparecer em Na mídia" vai no artigo (campo showInMedia).
          const doc =
            entry.doc._type === "article"
              ? { ...entry.doc, showInMedia: inMedia === true }
              : entry.doc;
          tx.createOrReplace(doc);
        }
        await tx.commit({ visibility: "async" });
      } catch (writeErr) {
        console.error("Falha ao gravar rascunhos:", docs, writeErr);
        const detail =
          writeErr instanceof Error ? writeErr.message : String(writeErr);
        throw new Error(`Erro ao gravar os rascunhos: ${detail}`);
      }
      setCreated(
        docs.map((entry) => ({
          id: entry._id,
          type: entry._type,
          label: entry.label,
        })),
      );
    } catch (err) {
      console.error("handleGenerate falhou:", err);
      setGenerateError(
        err instanceof Error
          ? err.message
          : "Falha ao gerar ou gravar os rascunhos.",
      );
    } finally {
      setGenerating(false);
    }
  }, [
    client,
    source,
    yt,
    web,
    url,
    material,
    targets,
    questionsCount,
    directions,
    inMedia,
  ]);

  const allowed = useMemo<IngestTarget[]>(
    () => (source ? SOURCE_TARGETS[source] : []),
    [source],
  );
  const anyTarget = allowed.some((key) => targets[key]);
  // Fonte de texto sem material suficiente não gera nada que preste.
  const needsPastedText =
    Boolean(web) && material.trim().length < (web?.minUsableText ?? 400);
  const serviceOnline = service.status === "online";
  const mediaPending = targets.article && allowed.includes("article") && inMedia === null;
  const ready =
    serviceOnline && Boolean(source) && anyTarget && !needsPastedText && !mediaPending;

  const toggle =
    (key: IngestTarget) => (e: React.ChangeEvent<HTMLInputElement>) => {
      // Lê o valor ANTES do updater: dentro do setTargets o React já anulou
      // o currentTarget (evento sintético reutilizado).
      const checked = e.currentTarget.checked;
      setTargets((t) => ({ ...t, [key]: checked }));
    };

  const numClamp = (v: string, min: number, max: number) =>
    Math.max(min, Math.min(max, Number(v) || min));

  return (
    <div style={s.wrap}>
      <h1 style={{ fontSize: 24, margin: "0 0 6px" }}>Importar de link</h1>
      <p style={{ ...s.muted, margin: "0 0 24px" }}>
        Cole um link do <strong>YouTube</strong>, da <strong>Forbes</strong> ou do{" "}
        <strong>LinkedIn</strong>. O sistema lê o material e gera rascunhos
        (pt/en/es) para você revisar e publicar. Cada fonte gera os seus tipos —
        vídeo/podcast só sai do YouTube; conceitos você cria à mão no menu
        “Conceitos”.
      </p>

      {/* Estado do serviço */}
      {service.status === "offline" && (
        <div style={{ ...s.error, marginBottom: 20 }}>
          <strong>O serviço de importação não está respondendo</strong> (
          {service.detail}). Sem ele, esta ferramenta não consegue ler links nem
          gerar rascunhos. Avise quem cuida do site; o restante do painel segue
          funcionando normalmente.
        </div>
      )}
      {service.status === "online" && service.health.anthropic === false && (
        <div style={{ ...s.warn, marginBottom: 20 }}>
          O serviço está de pé, mas <strong>sem a chave da Anthropic</strong>{" "}
          configurada. Dá para ler links, mas não para gerar rascunhos.
        </div>
      )}

      {/* Etapa 1 — URL */}
      <div style={s.card}>
        <div style={s.label}>1. Link</div>
        <div style={s.row}>
          <input
            style={s.input}
            value={url}
            onChange={(e) => setUrl(e.currentTarget.value)}
            placeholder="YouTube, Forbes ou LinkedIn — cole o link aqui"
            onKeyDown={(e) => {
              if (e.key === "Enter" && url.trim() && serviceOnline) handleInspect();
            }}
          />
          <button
            style={{
              ...s.btn,
              ...(!url.trim() || inspecting || !serviceOnline ? s.btnDisabled : {}),
              whiteSpace: "nowrap",
            }}
            disabled={!url.trim() || inspecting || !serviceOnline}
            onClick={handleInspect}
          >
            {inspecting
              ? "Buscando…"
              : service.status === "checking"
                ? "Conectando…"
                : "Buscar"}
          </button>
        </div>
        {inspectError && (
          <div style={{ ...s.error, marginTop: 12 }}>{inspectError}</div>
        )}
      </div>

      {/* Preview — YouTube */}
      {yt && (
        <div style={s.card}>
          <div style={{ display: "flex", gap: 16 }}>
            {yt.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={yt.thumbnail}
                alt=""
                width={160}
                style={{ borderRadius: 6, height: "fit-content" }}
              />
            )}
            <div style={{ flex: 1 }}>
              <span style={{ ...s.badge, ...s.sourceBadge }}>
                {SOURCE_LABEL.youtube}
              </span>
              <div style={{ fontSize: 16, fontWeight: 600, margin: "8px 0 6px" }}>
                {yt.title}
              </div>
              {yt.author && (
                <div style={{ ...s.muted, marginBottom: 10 }}>{yt.author}</div>
              )}
              {yt.transcriptAvailable ? (
                <span style={{ ...s.badge, ...s.ok }}>
                  {yt.transcriptSource === "whisper"
                    ? "Transcrição por áudio (Whisper)"
                    : "Transcrição detectada"}
                  {yt.transcriptLang ? ` (${yt.transcriptLang})` : ""}
                  {" · "}
                  {material.length.toLocaleString("pt-BR")} caracteres
                </span>
              ) : (
                <>
                  <span
                    style={{
                      ...s.badge,
                      background: "#fff4e5",
                      color: "#a15c00",
                    }}
                  >
                    Sem transcrição
                  </span>
                  <div style={{ ...s.muted, marginTop: 8 }}>
                    Sem legendas públicas. Você pode transcrever o áudio com IA
                    (Whisper) — recomendado — ou gerar só com título e descrição
                    (qualidade menor).
                  </div>
                  {yt.audioTranscriptionEnabled && (
                    <div style={{ marginTop: 10 }}>
                      <button
                        style={{
                          ...s.btn,
                          background: "#0f9d58",
                          ...(transcribing ? s.btnDisabled : {}),
                        }}
                        disabled={transcribing}
                        onClick={handleTranscribeAudio}
                      >
                        {transcribing
                          ? "Transcrevendo o áudio…"
                          : "Transcrever áudio (Whisper)"}
                      </button>
                      {transcribing && (
                        <div style={{ ...s.muted, marginTop: 8 }}>
                          Baixando e transcrevendo o áudio — pode levar de 1 a
                          alguns minutos, conforme a duração do vídeo.
                        </div>
                      )}
                      {transcribeError && (
                        <div style={{ ...s.error, marginTop: 10 }}>
                          {transcribeError}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              {(yt.chapters?.length || yt.durationSeconds) && (
                <div style={{ ...s.muted, marginTop: 8 }}>
                  {yt.durationSeconds
                    ? `${Math.round(yt.durationSeconds / 60)} min`
                    : ""}
                  {yt.chapters?.length
                    ? `${yt.durationSeconds ? " · " : ""}${yt.chapters.length} capítulos detectados`
                    : ""}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview — Forbes / LinkedIn */}
      {web && (
        <div style={s.card}>
          <span style={{ ...s.badge, ...s.sourceBadge }}>
            {SOURCE_LABEL[web.source]}
          </span>
          <div style={{ fontSize: 16, fontWeight: 600, margin: "8px 0 6px" }}>
            {web.title || "(sem título detectado)"}
          </div>
          <div style={{ ...s.muted, marginBottom: 12 }}>
            {[
              web.author,
              web.publishDate
                ? new Date(web.publishDate).toLocaleDateString("pt-BR")
                : null,
            ]
              .filter(Boolean)
              .join(" · ") || "—"}
          </div>

          {web.status === "ok" ? (
            <span style={{ ...s.badge, ...s.ok }}>
              Texto extraído · {material.length.toLocaleString("pt-BR")} caracteres
            </span>
          ) : (
            <div style={s.warn}>
              {web.status === "blocked"
                ? `O site bloqueou a leitura automática${
                    web.httpStatus ? ` (HTTP ${web.httpStatus})` : ""
                  }.`
                : "A leitura automática trouxe pouco texto (provável muro de login)."}{" "}
              <strong>Abra o link, copie o texto do artigo e cole abaixo.</strong>
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            <div style={s.label}>
              Texto do artigo{" "}
              <span style={{ fontWeight: 400, color: "#6b6b72" }}>
                (revise ou cole — é o material que a IA vai usar)
              </span>
            </div>
            <textarea
              style={{
                ...s.input,
                minHeight: 220,
                resize: "vertical",
                fontFamily: "ui-monospace, monospace",
                fontSize: 12.5,
                lineHeight: 1.5,
              }}
              value={material}
              onChange={(e) => setMaterial(e.currentTarget.value)}
              placeholder="Cole aqui o texto do artigo publicado pela Andrea."
            />
            {needsPastedText && (
              <div style={{ ...s.muted, marginTop: 6 }}>
                Mínimo de {web.minUsableText.toLocaleString("pt-BR")} caracteres
                para gerar com qualidade — hoje há {material.trim().length}.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Etapa 2 — o que gerar */}
      {source && (yt || web) && (
        <div style={s.card}>
          <div style={s.label}>2. O que gerar</div>
          <div style={{ ...s.muted, marginBottom: 6 }}>
            Opções disponíveis para {SOURCE_LABEL[source]}.
          </div>

          {allowed.map((key) => (
            <div key={key} style={s.checkRow}>
              <input
                type="checkbox"
                checked={targets[key]}
                onChange={toggle(key)}
              />
              <span style={{ flex: 1, fontSize: 14 }}>{TARGET_LABEL[key]}</span>
              {key === "questions" && targets.questions && (
                <input
                  type="number"
                  style={{ ...s.input, width: 64 }}
                  value={questionsCount}
                  onChange={(e) =>
                    setQuestionsCount(numClamp(e.currentTarget.value, 1, 12))
                  }
                />
              )}
            </div>
          ))}

          {targets.article && allowed.includes("article") && (
            <div
              style={{
                marginTop: 14,
                padding: "12px 14px",
                borderRadius: 8,
                border: `1px solid ${inMedia === null ? "#e0b4b4" : "#e3e3e8"}`,
                background: inMedia === null ? "#fdf5f5" : "transparent",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                O artigo também deve aparecer em “Na mídia”?
              </div>
              <div style={{ ...s.muted, marginTop: 4 }}>
                Sim = entra na lista da página Na mídia, com link para o original.
                Dá para mudar depois no próprio artigo (campo “Aparecer em Na mídia”).
              </div>
              <div style={{ display: "flex", gap: 18, marginTop: 10, fontSize: 14 }}>
                {[
                  { value: true, label: "Sim" },
                  { value: false, label: "Não" },
                ].map((o) => (
                  <label key={o.label} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="in-media"
                      checked={inMedia === o.value}
                      onChange={() => setInMedia(o.value)}
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 18 }}>
            <div style={s.label}>
              Direcionamentos específicos{" "}
              <span style={{ fontWeight: 400, color: "#6b6b72" }}>
                (opcional)
              </span>
            </div>
            <textarea
              style={{ ...s.input, minHeight: 80, resize: "vertical" }}
              value={directions}
              onChange={(e) => setDirections(e.currentTarget.value)}
              placeholder={
                "Orientações só para esta geração. Ex.: foque no público de líderes de RH; tom mais provocativo; evite jargão; destaque o tema da autoconfiança."
              }
            />
            <div style={{ ...s.muted, marginTop: 6 }}>
              As regras gerais ficam em <strong>⚙️ Agentes de IA</strong> no
              menu. Aqui é só o ajuste pontual desta importação.
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              style={{
                ...s.btn,
                ...(!ready || generating ? s.btnDisabled : {}),
              }}
              disabled={!ready || generating}
              onClick={handleGenerate}
            >
              {generating ? "Gerando…" : "Gerar rascunhos"}
            </button>
          </div>

          {generating && (
            <div style={{ ...s.muted, marginTop: 12 }}>
              O Claude está escrevendo em pt/en/es… costuma levar de 1 a 4
              minutos. Pode deixar esta aba aberta e voltar depois.
              {generateElapsed > 0 ? ` (${generateElapsed} s)` : ""}
            </div>
          )}

          {generateError && (
            <div style={{ ...s.error, marginTop: 12 }}>{generateError}</div>
          )}
        </div>
      )}

      {/* Resultado */}
      {created.length > 0 && (
        <div
          style={{
            ...s.card,
            background: "#e6f4ea",
            border: "1px solid #b7dfc3",
          }}
        >
          <div style={{ ...s.label, marginBottom: 6 }}>
            ✓ {created.length} rascunho(s) criado(s)
          </div>
          <div style={{ ...s.muted, marginBottom: 14 }}>
            Clique para abrir em nova aba (a lista continua aqui). Revise e
            publique cada um pelo botão <strong>Publish</strong> do Studio.
          </div>
          {created.map((item) => (
            <div key={item.id} style={{ ...s.row, marginBottom: 8 }}>
              <span
                style={{ ...s.badge, background: "#dfe3e8", color: "#1a1a1a" }}
              >
                {TYPE_LABEL[item.type] ?? item.type}
              </span>
              <a
                href={intentHref(basePath, item.id, item.type)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, color: "#1a5e2c", fontSize: 14 }}
              >
                {item.label} ↗
              </a>
            </div>
          ))}

          <div
            style={{
              marginTop: 18,
              borderTop: "1px solid #b7dfc3",
              paddingTop: 16,
            }}
          >
            <button style={s.btn} onClick={handleReset}>
              Concluir e importar outro link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
