import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useClient } from "sanity";

const API_VERSION = "2024-10-01";
const INGEST_SECRET = process.env.NEXT_PUBLIC_INGEST_API_SECRET;

type Chapter = { startTime: number; title: string };

type InspectData = {
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
  concept: "Conceito",
};

function intentHref(id: string, type: string): string {
  const baseId = id.replace(/^drafts\./, "");
  return `/studio/intent/edit/id=${baseId};type=${type}/`;
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
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 0",
  },
};

export default function YouTubeIngestTool() {
  const client = useClient({ apiVersion: API_VERSION });

  const [url, setUrl] = useState("");
  const [inspecting, setInspecting] = useState(false);
  const [inspect, setInspect] = useState<InspectData | null>(null);
  const [inspectError, setInspectError] = useState<string | null>(null);

  const [targets, setTargets] = useState({
    video: true,
    questions: true,
    article: false,
    concepts: false,
  });
  const [questionsCount, setQuestionsCount] = useState(5);
  const [conceptsCount, setConceptsCount] = useState(4);
  const [directions, setDirections] = useState("");

  // Pré-carrega as quantidades padrão definidas no painel "Agentes de IA".
  useEffect(() => {
    let active = true;
    client
      .fetch<{ q?: number; c?: number } | null>(
        `*[_id == "aiSettings"][0]{"q": defaultQuestionsCount, "c": defaultConceptsCount}`,
      )
      .then((cfg) => {
        if (!active || !cfg) return;
        if (typeof cfg.q === "number") setQuestionsCount(cfg.q);
        if (typeof cfg.c === "number") setConceptsCount(cfg.c);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [client]);

  const [generating, setGenerating] = useState(false);
  const [created, setCreated] = useState<CreatedItem[]>([]);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [transcribing, setTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  const handleInspect = useCallback(async () => {
    setInspecting(true);
    setInspectError(null);
    setInspect(null);
    setCreated([]);
    setGenerateError(null);
    setTranscribeError(null);
    try {
      const res = await fetch("/api/ingest/youtube/inspect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInspectError(
          data?.error === "invalid_url"
            ? "URL do YouTube inválida."
            : data?.error === "not_found"
              ? "Vídeo não encontrado."
              : "Não foi possível ler o vídeo.",
        );
        return;
      }
      setInspect(data as InspectData);
    } catch {
      setInspectError("Falha de rede ao buscar o vídeo.");
    } finally {
      setInspecting(false);
    }
  }, [url]);

  // Limpa tudo para começar uma nova importação do zero.
  const handleReset = useCallback(() => {
    setUrl("");
    setInspect(null);
    setInspectError(null);
    setCreated([]);
    setGenerateError(null);
    setTranscribeError(null);
    setDirections("");
    setTargets({
      video: true,
      questions: true,
      article: false,
      concepts: false,
    });
  }, []);

  const handleTranscribeAudio = useCallback(async () => {
    if (!inspect) return;
    setTranscribing(true);
    setTranscribeError(null);
    try {
      const res = await fetch("/api/ingest/youtube/transcribe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(INGEST_SECRET ? { "x-ingest-secret": INGEST_SECRET } : {}),
        },
        body: JSON.stringify({ url: inspect.url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTranscribeError(
          data?.message || "Falha ao transcrever o áudio. Tente de novo.",
        );
        return;
      }
      // Injeta a transcrição obtida no preview, para a geração usá-la.
      setInspect((prev) =>
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
  }, [inspect]);

  const handleGenerate = useCallback(async () => {
    if (!inspect) return;
    setGenerating(true);
    setGenerateError(null);
    setCreated([]);
    try {
      const res = await fetch("/api/ingest/youtube/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(INGEST_SECRET ? { "x-ingest-secret": INGEST_SECRET } : {}),
        },
        body: JSON.stringify({
          url: inspect.url,
          transcript: inspect.transcript,
          transcriptLang: inspect.transcriptLang,
          publishDate: inspect.publishDate,
          chapters: inspect.chapters,
          meta: {
            title: inspect.title,
            author: inspect.author,
            description: inspect.description,
            durationSeconds: inspect.durationSeconds,
          },
          targets,
          counts: { questions: questionsCount, concepts: conceptsCount },
          directions: directions.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenerateError(
          data?.message || "Falha ao gerar o conteúdo. Tente de novo.",
        );
        return;
      }

      // Grava todos os rascunhos numa ÚNICA transação, pela sessão autenticada
      // do Studio. Transação = atômico (tudo ou nada) e mais rápido. As
      // referências entre os documentos são fracas (ver backend), então a ordem
      // não importa e nada falha por alvo ainda inexistente.
      const docs = (data.documents ?? []) as GeneratedDoc[];
      try {
        const tx = client.transaction();
        for (const entry of docs) tx.createOrReplace(entry.doc);
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
  }, [client, inspect, targets, questionsCount, conceptsCount, directions]);

  const anyTarget =
    targets.video || targets.questions || targets.article || targets.concepts;

  const toggle = (key: keyof typeof targets) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    // Lê o valor ANTES do updater: dentro do setTargets o React já anulou
    // o currentTarget (evento sintético reutilizado).
    const checked = e.currentTarget.checked;
    setTargets((t) => ({ ...t, [key]: checked }));
  };

  const numClamp = (v: string, min: number, max: number) =>
    Math.max(min, Math.min(max, Number(v) || min));

  return (
    <div style={s.wrap}>
      <h1 style={{ fontSize: 24, margin: "0 0 6px" }}>Importar do YouTube</h1>
      <p style={{ ...s.muted, margin: "0 0 24px" }}>
        Cole o link de um vídeo/podcast. O sistema lê os dados e gera rascunhos
        de conteúdo (pt/en/es) para você revisar e publicar.
      </p>

      {/* Etapa 1 — URL */}
      <div style={s.card}>
        <div style={s.label}>1. Link do vídeo</div>
        <div style={s.row}>
          <input
            style={s.input}
            value={url}
            onChange={(e) => setUrl(e.currentTarget.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && url.trim()) handleInspect();
            }}
          />
          <button
            style={{
              ...s.btn,
              ...(!url.trim() || inspecting ? s.btnDisabled : {}),
              whiteSpace: "nowrap",
            }}
            disabled={!url.trim() || inspecting}
            onClick={handleInspect}
          >
            {inspecting ? "Buscando…" : "Buscar"}
          </button>
        </div>
        {inspectError && (
          <div style={{ ...s.error, marginTop: 12 }}>{inspectError}</div>
        )}
      </div>

      {/* Preview + Etapa 2 */}
      {inspect && (
        <>
          <div style={s.card}>
            <div style={{ display: "flex", gap: 16 }}>
              {inspect.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={inspect.thumbnail}
                  alt=""
                  width={160}
                  style={{ borderRadius: 6, height: "fit-content" }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
                  {inspect.title}
                </div>
                {inspect.author && (
                  <div style={{ ...s.muted, marginBottom: 10 }}>
                    {inspect.author}
                  </div>
                )}
                {inspect.transcriptAvailable ? (
                  <span
                    style={{
                      ...s.badge,
                      background: "#e6f4ea",
                      color: "#1e7e34",
                    }}
                  >
                    {inspect.transcriptSource === "whisper"
                      ? "Transcrição por áudio (Whisper)"
                      : "Transcrição detectada"}
                    {inspect.transcriptLang ? ` (${inspect.transcriptLang})` : ""}
                    {" · "}
                    {inspect.transcript.length.toLocaleString("pt-BR")} caracteres
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
                    {inspect.audioTranscriptionEnabled && (
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
                {(inspect.chapters?.length || inspect.durationSeconds) && (
                  <div style={{ ...s.muted, marginTop: 8 }}>
                    {inspect.durationSeconds
                      ? `${Math.round(inspect.durationSeconds / 60)} min`
                      : ""}
                    {inspect.chapters?.length
                      ? `${inspect.durationSeconds ? " · " : ""}${inspect.chapters.length} capítulos detectados`
                      : ""}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={s.card}>
            <div style={s.label}>2. O que gerar</div>

            <div style={s.checkRow}>
              <input
                type="checkbox"
                checked={targets.questions}
                onChange={toggle("questions")}
              />
              <span style={{ flex: 1, fontSize: 14 }}>
                FAQ — Perguntas e respostas
              </span>
              {targets.questions && (
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

            <div style={s.checkRow}>
              <input
                type="checkbox"
                checked={targets.concepts}
                onChange={toggle("concepts")}
              />
              <span style={{ flex: 1, fontSize: 14 }}>Conceitos</span>
              {targets.concepts && (
                <input
                  type="number"
                  style={{ ...s.input, width: 64 }}
                  value={conceptsCount}
                  onChange={(e) =>
                    setConceptsCount(numClamp(e.currentTarget.value, 1, 10))
                  }
                />
              )}
            </div>

            <div style={s.checkRow}>
              <input
                type="checkbox"
                checked={targets.article}
                onChange={toggle("article")}
              />
              <span style={{ flex: 1, fontSize: 14 }}>Artigo</span>
            </div>

            <div style={s.checkRow}>
              <input
                type="checkbox"
                checked={targets.video}
                onChange={toggle("video")}
              />
              <span style={{ flex: 1, fontSize: 14 }}>
                Resumo + vídeo (página de vídeo)
              </span>
            </div>

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
                menu. Aqui é só o ajuste pontual deste vídeo.
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <button
                style={{
                  ...s.btn,
                  ...(!anyTarget || generating ? s.btnDisabled : {}),
                }}
                disabled={!anyTarget || generating}
                onClick={handleGenerate}
              >
                {generating ? "Gerando…" : "Gerar rascunhos"}
              </button>
            </div>

            {generating && (
              <div style={{ ...s.muted, marginTop: 12 }}>
                O Claude está escrevendo em pt/en/es… isso pode levar alguns
                segundos.
              </div>
            )}

            {generateError && (
              <div style={{ ...s.error, marginTop: 12 }}>{generateError}</div>
            )}
          </div>
        </>
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
                href={intentHref(item.id, item.type)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, color: "#1a5e2c", fontSize: 14 }}
              >
                {item.label} ↗
              </a>
            </div>
          ))}

          <div style={{ marginTop: 18, borderTop: "1px solid #b7dfc3", paddingTop: 16 }}>
            <button style={s.btn} onClick={handleReset}>
              Concluir e importar outro vídeo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
