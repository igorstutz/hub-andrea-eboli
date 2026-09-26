import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useClient } from "sanity";
import { api, apiHeaders } from "./serviceApi";

// Ferramenta "Acessos": de onde vêm as visitas do site.
//
// Os dados são gravados pelo serviço da hospedagem (src/lib/analytics/track.ts)
// a cada página vista, e o site manda com o componente SiteTracker. Aqui só se
// lê o resumo do período (GET /track/summary) e, se ela quiser, a planilha
// das sessões (GET /track/export).
//
// Como ler: uma SESSÃO é uma visita (a pessoa chegou, leu uma ou mais páginas);
// a origem dela é a da página de entrada. "utm_*" vêm dos links marcados que a
// Andrea divulga; sem UTM, a origem é deduzida do site que mandou a visita
// (buscador, rede social, IA) ou fica "(direto)".

const API_VERSION = "2024-10-01";

type Row = { key: string; sessions: number; pageviews: number };
type Summary = {
  range: { from: string; to: string; days: number };
  totals: {
    sessions: number;
    pageviews: number;
    pagesPerSession: number;
    bounceRate: number;
    withCampaign: number;
  };
  previous: { sessions: number; pageviews: number };
  daily: Array<{ day: string; sessions: number; pageviews: number }>;
  bySourceMedium: Row[];
  bySource: Row[];
  byMedium: Row[];
  byCampaign: Row[];
  byTerm: Row[];
  byContent: Row[];
  byReferrer: Row[];
  byLanding: Row[];
  byDevice: Row[];
  byLocale: Row[];
  topPages: Array<{ key: string; pageviews: number }>;
  recent: Array<{
    start: string;
    src: string;
    med: string;
    cmp?: string;
    trm?: string;
    ref?: string;
    landing: string;
    pages: number;
    dev: string;
  }>;
};

// Paleta: a marca (vinho) numa série só. Texto sempre em tinta neutra.
const C = {
  ink: "#1f1d1b",
  soft: "#5c5650",
  muted: "#8b8580",
  line: "#e7e2dc",
  track: "#f3efea",
  surface: "#ffffff",
  bar: "#6b2a33",
  barHover: "#41181e",
  up: "#1e7e34",
  down: "#b3261e",
};

const s: Record<string, CSSProperties> = {
  // Fundo claro próprio: o painel pode estar no tema escuro, e os cartões e a
  // tinta daqui são desenhados para fundo claro.
  shell: { height: "100%", overflow: "auto", background: "#f6f3ef" },
  page: { padding: "28px 32px 64px", maxWidth: 1180, margin: "0 auto", color: C.ink, fontFamily: "inherit" },
  h1: { fontSize: 24, fontWeight: 600, margin: 0 },
  lead: { color: C.soft, marginTop: 6, fontSize: 14, lineHeight: 1.5, maxWidth: 760 },
  bar: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 20 },
  pill: { border: `1px solid ${C.line}`, background: C.surface, borderRadius: 999, padding: "6px 14px", fontSize: 13, cursor: "pointer", color: C.ink },
  pillOn: { background: C.ink, color: "#fff", borderColor: C.ink },
  grid: { display: "grid", gap: 16, marginTop: 20 },
  card: { background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18 },
  kLabel: { fontSize: 12, color: C.soft, textTransform: "uppercase", letterSpacing: "0.06em" },
  kValue: { fontSize: 30, fontWeight: 600, marginTop: 6, fontVariantNumeric: "tabular-nums" },
  kNote: { fontSize: 12, marginTop: 4, color: C.muted },
  h2: { fontSize: 15, fontWeight: 600, margin: "0 0 12px" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", fontWeight: 500, color: C.muted, fontSize: 12, padding: "6px 8px", borderBottom: `1px solid ${C.line}` },
  td: { padding: "7px 8px", borderBottom: `1px solid ${C.track}`, verticalAlign: "middle" },
  num: { textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" },
  empty: { color: C.muted, fontSize: 13, padding: "8px 0" },
  error: { background: "#fdecea", color: "#8a1c14", borderRadius: 8, padding: "12px 14px", marginTop: 20, fontSize: 14 },
  input: { width: "100%", border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, boxSizing: "border-box", background: C.surface, color: C.ink, colorScheme: "light" },
  label: { fontSize: 12, color: C.soft, display: "block", marginBottom: 4 },
};

const fmt = new Intl.NumberFormat("pt-BR");
const fmt1 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const pct = (v: number) => `${fmt1.format(v * 100)}%`;
const dayLabel = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};

function Delta({ now, before }: { now: number; before: number }) {
  if (!before) return <div style={s.kNote}>sem período anterior para comparar</div>;
  const change = (now - before) / before;
  const up = change >= 0;
  return (
    <div style={s.kNote}>
      <span style={{ color: up ? C.up : C.down, fontWeight: 600 }}>
        {up ? "▲" : "▼"} {pct(Math.abs(change))}
      </span>{" "}
      vs. período anterior ({fmt.format(before)})
    </div>
  );
}

function Kpi({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div style={s.card}>
      <div style={s.kLabel}>{label}</div>
      <div style={s.kValue}>{value}</div>
      {children}
    </div>
  );
}

/** Sessões por dia: uma série, barras finas com topo arredondado, dica ao passar o mouse. */
function DailyChart({ daily }: { daily: Summary["daily"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...daily.map((d) => d.sessions));
  const H = 160;
  const every = Math.ceil(daily.length / 10);
  return (
    <div style={s.card}>
      <h2 style={s.h2}>Sessões por dia</h2>
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: H, borderBottom: `1px solid ${C.line}` }}>
          {daily.map((d, i) => (
            <div
              key={d.day}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end", cursor: "default" }}
            >
              <div
                style={{
                  width: "100%",
                  height: `${(d.sessions / max) * 100}%`,
                  minHeight: d.sessions ? 2 : 0,
                  background: hover === i ? C.barHover : C.bar,
                  borderRadius: "4px 4px 0 0",
                }}
              />
            </div>
          ))}
        </div>
        {hover !== null && (
          <div
            style={{
              position: "absolute",
              top: -6,
              left: `${((hover + 0.5) / daily.length) * 100}%`,
              transform: "translate(-50%, -100%)",
              background: C.ink,
              color: "#fff",
              fontSize: 12,
              padding: "6px 10px",
              borderRadius: 6,
              whiteSpace: "nowrap",
              pointerEvents: "none",
            }}
          >
            <strong>{dayLabel(daily[hover].day)}</strong> · {fmt.format(daily[hover].sessions)} sessões ·{" "}
            {fmt.format(daily[hover].pageviews)} páginas
          </div>
        )}
        <div style={{ display: "flex", gap: 2, marginTop: 6 }}>
          {daily.map((d, i) => (
            <div key={d.day} style={{ flex: 1, fontSize: 10, color: C.muted, textAlign: "center", overflow: "visible", whiteSpace: "nowrap" }}>
              {i % every === 0 ? dayLabel(d.day) : ""}
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...s.kNote, marginTop: 8 }}>Pico do período: {fmt.format(max)} sessões num dia.</div>
    </div>
  );
}

/** Tabela com barra de magnitude (proporção das sessões do período). */
function RankTable({
  title,
  rows,
  total,
  keyLabel,
  emptyText = "Nada no período.",
  mono = false,
  pageviewsOnly = false,
}: {
  title: string;
  rows: Row[];
  total: number;
  keyLabel: string;
  emptyText?: string;
  mono?: boolean;
  /** Tabela de páginas: uma coluna só, de páginas vistas. */
  pageviewsOnly?: boolean;
}) {
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, 8);
  return (
    <div style={s.card}>
      <h2 style={s.h2}>{title}</h2>
      {rows.length === 0 ? (
        <div style={s.empty}>{emptyText}</div>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>{keyLabel}</th>
              <th style={{ ...s.th, ...s.num }}>{pageviewsOnly ? "Vezes vista" : "Sessões"}</th>
              {!pageviewsOnly && <th style={{ ...s.th, ...s.num }}>Páginas</th>}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.key} title={`${r.key}: ${r.sessions} sessões, ${r.pageviews} páginas vistas`}>
                <td style={s.td}>
                  <div style={{ fontFamily: mono ? "ui-monospace, monospace" : undefined, fontSize: mono ? 12 : 13, wordBreak: "break-all" }}>
                    {r.key}
                  </div>
                  <div style={{ height: 4, background: C.track, borderRadius: 4, marginTop: 4 }}>
                    <div style={{ height: 4, width: `${total ? (r.sessions / total) * 100 : 0}%`, background: C.bar, borderRadius: 4 }} />
                  </div>
                </td>
                <td style={{ ...s.td, ...s.num }}>
                  {fmt.format(r.sessions)} <span style={{ color: C.muted }}>({pct(total ? r.sessions / total : 0)})</span>
                </td>
                {!pageviewsOnly && <td style={{ ...s.td, ...s.num }}>{fmt.format(r.pageviews)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {rows.length > 8 && (
        <button type="button" style={{ ...s.pill, marginTop: 10 }} onClick={() => setAll(!all)}>
          {all ? "Mostrar menos" : `Mostrar todos (${rows.length})`}
        </button>
      )}
    </div>
  );
}

/** Monta links com UTM para divulgação: é o que faz a origem aparecer aqui. */
function UtmBuilder() {
  const [base, setBase] = useState("https://andreaeboli.com/pt/");
  const [v, setV] = useState({ source: "", medium: "", campaign: "", term: "", content: "" });
  const [copied, setCopied] = useState(false);
  const link = useMemo(() => {
    try {
      const u = new URL(base);
      for (const [k, val] of Object.entries(v)) {
        const clean = val.trim().toLowerCase().replace(/\s+/g, "-");
        if (clean) u.searchParams.set(`utm_${k}`, clean);
      }
      return u.toString();
    } catch {
      return "";
    }
  }, [base, v]);
  const fields: Array<[keyof typeof v, string, string]> = [
    ["source", "utm_source · onde o link foi postado", "instagram, linkedin, newsletter"],
    ["medium", "utm_medium · o tipo de canal", "social, email, bio, stories"],
    ["campaign", "utm_campaign · a campanha", "lancamento-livro, pesquisa-ecp"],
    ["term", "utm_term · palavra-chave (opcional)", "poder-consciente"],
    ["content", "utm_content · qual peça (opcional)", "carrossel-1, video-reels"],
  ];
  return (
    <div style={s.card}>
      <h2 style={s.h2}>Gerar link de campanha</h2>
      <p style={{ ...s.lead, marginTop: 0, marginBottom: 14 }}>
        Use estes links ao divulgar: cada visita que chegar por eles aparece acima com a campanha certa. Preencha pelo menos a origem.
      </p>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={s.label}>Página de destino</label>
          <input style={s.input} value={base} onChange={(e) => setBase(e.target.value)} />
        </div>
        {fields.map(([k, label, ph]) => (
          <div key={k}>
            <label style={s.label}>{label}</label>
            <input style={s.input} placeholder={ph} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
          </div>
        ))}
      </div>
      {link && v.source.trim() && (
        <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <code style={{ flex: 1, minWidth: 260, background: C.track, padding: "8px 10px", borderRadius: 8, fontSize: 12, wordBreak: "break-all" }}>
            {link}
          </code>
          <button
            type="button"
            style={{ ...s.pill, ...s.pillOn }}
            onClick={() => {
              navigator.clipboard.writeText(link).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              });
            }}
          >
            {copied ? "Copiado ✓" : "Copiar link"}
          </button>
        </div>
      )}
    </div>
  );
}

const PERIODS = [7, 30, 90, 365];

export default function DashboardTool() {
  const client = useClient({ apiVersion: API_VERSION });
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Cada busca tem uma chave (período + clique em "Atualizar"); está carregando
  // enquanto a última resposta não é a da chave atual.
  const [reload, setReload] = useState(0);
  const want = `${days}:${reload}`;
  const [got, setGot] = useState<string | null>(null);
  const loading = got !== want;

  useEffect(() => {
    let active = true;
    fetch(api(`/track/summary?days=${days}`), { headers: apiHeaders(client) })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (res.status === 401) throw new Error("Sua sessão no painel não foi reconhecida pelo serviço. Saia e entre de novo no painel.");
        if (res.status === 403) throw new Error(body?.message || "Seu papel neste projeto não pode ver os acessos.");
        if (!res.ok || !body) throw new Error(`O serviço de acessos não respondeu (HTTP ${res.status}).`);
        if (!active) return;
        setData(body as Summary);
        setError(null);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : "Falha de rede ao buscar os acessos.");
      })
      .finally(() => {
        if (active) setGot(`${days}:${reload}`);
      });
    return () => {
      active = false;
    };
  }, [client, days, reload]);

  const exportCsv = async () => {
    const res = await fetch(api(`/track/export?days=${days}`), { headers: apiHeaders(client) });
    if (!res.ok) {
      setError(`Não consegui gerar a planilha (HTTP ${res.status}).`);
      return;
    }
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `acessos-ultimos-${days}-dias.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const t = data?.totals;
  return (
    <div style={s.shell}>
    <div style={s.page}>
      <h1 style={s.h1}>Acessos do site</h1>
      <p style={s.lead}>
        De onde vêm as visitas: links de campanha (UTM), buscadores, redes sociais, assistentes de IA e outros sites. Uma
        sessão é uma visita; a origem é a da primeira página. Sem cookies e sem guardar IP. Para não contar as suas
        próprias visitas, abra o site uma vez com <code>?naomedir=1</code> no fim do endereço, em cada navegador que usar.
      </p>

      <div style={s.bar}>
        {PERIODS.map((p) => (
          <button key={p} type="button" style={{ ...s.pill, ...(p === days ? s.pillOn : {}) }} onClick={() => setDays(p)}>
            {p === 365 ? "12 meses" : `${p} dias`}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <button type="button" style={s.pill} onClick={() => setReload((n) => n + 1)} disabled={loading}>
          {loading ? "Atualizando…" : "Atualizar"}
        </button>
        <button type="button" style={s.pill} onClick={exportCsv} disabled={!data}>
          Baixar planilha (CSV)
        </button>
      </div>

      {error && <div style={s.error}>{error}</div>}
      {!data && !error && <p style={s.empty}>Carregando…</p>}

      {data && t && (
        <>
          <div style={{ ...s.kNote, marginTop: 12 }}>
            De {dayLabel(data.range.from)} a {dayLabel(data.range.to)} (horário de Brasília)
          </div>
          <div style={{ ...s.grid, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
            <Kpi label="Sessões" value={fmt.format(t.sessions)}>
              <Delta now={t.sessions} before={data.previous.sessions} />
            </Kpi>
            <Kpi label="Páginas vistas" value={fmt.format(t.pageviews)}>
              <Delta now={t.pageviews} before={data.previous.pageviews} />
            </Kpi>
            <Kpi label="Páginas por sessão" value={fmt1.format(t.pagesPerSession)}>
              <div style={s.kNote}>quanto a pessoa lê depois de chegar</div>
            </Kpi>
            <Kpi label="Saíram na 1ª página" value={pct(t.bounceRate)}>
              <div style={s.kNote}>sessões com uma página só</div>
            </Kpi>
            <Kpi label="Vieram de campanha" value={fmt.format(t.withCampaign)}>
              <div style={s.kNote}>{t.sessions ? pct(t.withCampaign / t.sessions) : "0%"} das sessões têm utm_campaign</div>
            </Kpi>
          </div>

          <div style={s.grid}>
            <DailyChart daily={data.daily} />
          </div>

          <div style={{ ...s.grid, gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
            <RankTable title="Origem / meio" keyLabel="utm_source / utm_medium" rows={data.bySourceMedium} total={t.sessions} />
            <RankTable
              title="Campanhas"
              keyLabel="utm_campaign"
              rows={data.byCampaign}
              total={t.sessions}
              emptyText="Nenhuma visita com utm_campaign no período. Use o gerador de link abaixo ao divulgar."
            />
            <RankTable title="Origem" keyLabel="utm_source" rows={data.bySource} total={t.sessions} />
            <RankTable title="Meio" keyLabel="utm_medium" rows={data.byMedium} total={t.sessions} />
            <RankTable title="Termo" keyLabel="utm_term" rows={data.byTerm} total={t.sessions} emptyText="Nenhum utm_term no período." />
            <RankTable title="Conteúdo" keyLabel="utm_content" rows={data.byContent} total={t.sessions} emptyText="Nenhum utm_content no período." />
            <RankTable title="Sites que mandaram visitas" keyLabel="domínio" rows={data.byReferrer} total={t.sessions} />
            <RankTable title="Páginas de entrada" keyLabel="página" rows={data.byLanding} total={t.sessions} mono />
            <RankTable title="Dispositivo" keyLabel="tipo" rows={data.byDevice} total={t.sessions} />
            <RankTable title="Idioma do site" keyLabel="idioma" rows={data.byLocale} total={t.sessions} />
            <RankTable
              title="Páginas mais vistas"
              keyLabel="página"
              rows={data.topPages.map((p) => ({ key: p.key, sessions: p.pageviews, pageviews: p.pageviews }))}
              total={t.pageviews}
              mono
              pageviewsOnly
            />
          </div>

          <div style={s.grid}>
            <UtmBuilder />
            <RecentSessions recent={data.recent} />
          </div>
        </>
      )}
    </div>
    </div>
  );
}

function RecentSessions({ recent }: { recent: Summary["recent"] }) {
  const [all, setAll] = useState(false);
  const shown = all ? recent : recent.slice(0, 12);
  return (
            <div style={s.card}>
              <h2 style={s.h2}>Últimas sessões</h2>
              {recent.length === 0 ? (
                <div style={s.empty}>Nenhuma visita no período.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        {["Quando", "Origem / meio", "Campanha", "Termo", "Entrou por", "Páginas", "Dispositivo"].map((h) => (
                          <th key={h} style={s.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((r, i) => (
                        <tr key={i}>
                          <td style={{ ...s.td, whiteSpace: "nowrap" }}>
                            {new Date(r.start).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })}
                          </td>
                          <td style={s.td}>{r.src} / {r.med}</td>
                          <td style={s.td}>{r.cmp ?? "—"}</td>
                          <td style={s.td}>{r.trm ?? "—"}</td>
                          <td style={{ ...s.td, fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{r.landing}</td>
                          <td style={{ ...s.td, ...s.num }}>{r.pages}</td>
                          <td style={s.td}>{r.dev}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {recent.length > 12 && (
                <button type="button" style={{ ...s.pill, marginTop: 10 }} onClick={() => setAll(!all)}>
                  {all ? "Mostrar menos" : `Mostrar as ${recent.length} mais recentes`}
                </button>
              )}
            </div>
  );
}
