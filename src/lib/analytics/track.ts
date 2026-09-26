// Medição de acessos do site: de onde vem cada visita (UTM, buscador, rede
// social, IA, link de outro site), gravada pela própria hospedagem.
//
// 🔴 POR QUE PRÓPRIO, E NÃO GOOGLE ANALYTICS (decidido com o Igor em
// 25/09/2026): o serviço Node do cPanel já existe e já roda no mesmo domínio
// (andreaeboli.com/api). Os dados ficam na hospedagem que ele já paga, sem
// terceiro, sem conta nova e sem banner de cookies, e o painel mostra tudo numa
// aba do próprio /admin.
//
// 🔒 PRIVACIDADE (LGPD), de propósito:
//   · sem cookie; o navegador guarda só um id de SESSÃO aleatório em
//     sessionStorage, que morre quando a aba fecha ou após 30 min parado;
//   · o IP NÃO é gravado (só serve, em memória, para limitar abuso);
//   · do referrer guardamos só o DOMÍNIO, nunca a URL (que pode ter dados);
//   · navegador com "Do Not Track" ou GPC ligado não é medido (ver o
//     componente `SiteTracker`).
//
// COMO FUNCIONA
//   POST /track          → público; o site manda uma página vista (sendBeacon)
//   GET  /track/summary  → sessão do painel; os indicadores do período
//   GET  /track/export   → sessão do painel; as sessões em CSV
// Cada página vista vira uma linha JSON num arquivo por dia (JSONL). Um hub de
// conteúdo tem centenas de visitas por dia, não milhões: ler os arquivos do
// período e agregar na hora é mais simples e mais robusto do que um banco.
//
// ONDE FICAM OS ARQUIVOS: `TRACK_DATA_DIR`, ou `~/andrea-analytics` no ar.
// FORA de public_html de propósito: o envio do serviço por FTP sincroniza a
// pasta do app, e o dado não pode morar onde um deploy mexe.
//
// Nada aqui pode importar de "next/*": roda também no serviço do cPanel.

import { appendFile, mkdir, readFile, stat } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { authFailure, requireMember } from "@/lib/ingest/auth";

type Handler = (req: Request) => Promise<Response>;

const DATA_DIR =
  process.env.TRACK_DATA_DIR ||
  (process.env.NODE_ENV === "production"
    ? path.join(homedir(), "andrea-analytics")
    : path.join(tmpdir(), "andrea-analytics-dev"));

// O dia da Andrea é o de São Paulo: "hoje" no painel vira à meia-noite dela.
const TZ = "America/Sao_Paulo";

// Teto de um arquivo diário. Protege o disco se alguém martelar o endpoint:
// 20 MB são ~100 mil páginas vistas num dia, muito além do tráfego real.
const MAX_DAY_FILE = 20 * 1024 * 1024;

// ---------------------------------------------------------------------------
// O evento
// ---------------------------------------------------------------------------

/** Como o navegador manda (ver src/components/SiteTracker.tsx). */
type Incoming = {
  sid?: unknown;
  path?: unknown;
  locale?: unknown;
  landing?: unknown;
  ref?: unknown;
  clid?: unknown;
  utm?: Record<string, unknown>;
};

/** Como fica gravado: nomes curtos, porque são milhares de linhas. */
export type StoredEvent = {
  t: string; // ISO
  sid: string;
  p: string; // caminho da página
  l?: string; // idioma
  n?: 1; // 1 = primeira página da sessão (a de entrada)
  src: string; // origem
  med: string; // meio
  cmp?: string; // campanha
  trm?: string; // termo
  cnt?: string; // conteúdo
  ref?: string; // domínio que mandou a visita
  dev: "mobile" | "tablet" | "desktop";
};

const clean = (v: unknown, max = 200): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

const BOT_RE =
  /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch|go-http|java\/|okhttp|httpclient/i;

function deviceOf(ua: string): StoredEvent["dev"] {
  if (/ipad|tablet|kindle|silk|playbook/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) {
    return "tablet";
  }
  return /mobi|iphone|ipod|android/i.test(ua) ? "mobile" : "desktop";
}

// ---------------------------------------------------------------------------
// De onde veio: UTM > identificador de clique de anúncio > referrer > direto
// ---------------------------------------------------------------------------

// A ordem importa: gemini.google.com tem de casar ANTES de google.*.
const REFERRERS: Array<[RegExp, string, string]> = [
  // assistentes de IA — num hub de GEO é o canal que mais interessa acompanhar
  [/(^|\.)(chatgpt\.com|chat\.openai\.com|openai\.com)$/, "chatgpt", "ia"],
  [/(^|\.)perplexity\.ai$/, "perplexity", "ia"],
  [/(^|\.)claude\.ai$/, "claude", "ia"],
  [/(^|\.)gemini\.google\.com$/, "gemini", "ia"],
  [/(^|\.)copilot\.microsoft\.com$/, "copilot", "ia"],
  [/(^|\.)(you\.com|phind\.com|deepseek\.com|chat\.deepseek\.com|meta\.ai|grok\.com)$/, "outra-ia", "ia"],
  // buscadores
  [/(^|\.)google\.[a-z.]+$/, "google", "organico"],
  [/(^|\.)bing\.com$/, "bing", "organico"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo", "organico"],
  [/(^|\.)yahoo\.[a-z.]+$/, "yahoo", "organico"],
  [/(^|\.)(ecosia\.org|search\.brave\.com|yandex\.[a-z.]+|baidu\.com)$/, "outro-buscador", "organico"],
  // redes sociais
  [/(^|\.)instagram\.com$/, "instagram", "social"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, "facebook", "social"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "linkedin", "social"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube", "social"],
  [/(^|\.)(t\.co|x\.com|twitter\.com)$/, "x", "social"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "whatsapp", "social"],
  [/(^|\.)tiktok\.com$/, "tiktok", "social"],
  [/(^|\.)threads\.(net|com)$/, "threads", "social"],
  [/(^|\.)(pinterest\.[a-z.]+|pin\.it)$/, "pinterest", "social"],
  [/(^|\.)(telegram\.org|t\.me)$/, "telegram", "social"],
  [/(^|\.)spotify\.com$/, "spotify", "social"],
  [/(^|\.)(mail\.google\.com|outlook\.live\.com|outlook\.office\.com)$/, "email", "email"],
];

// Aplicativos Android mandam `android-app://com.linkedin.android/`.
const ANDROID_APPS: Record<string, string> = {
  "com.linkedin.android": "linkedin.com",
  "com.instagram.android": "instagram.com",
  "com.facebook.katana": "facebook.com",
  "com.google.android.gm": "mail.google.com",
  "com.google.android.googlequicksearchbox": "google.com",
  "com.whatsapp": "whatsapp.com",
  "org.telegram.messenger": "telegram.org",
  "com.twitter.android": "x.com",
};

// Clique em anúncio sem UTM (o Google e a Meta põem o próprio parâmetro).
const CLICK_IDS: Record<string, [string, string]> = {
  gclid: ["google", "cpc"],
  gbraid: ["google", "cpc"],
  wbraid: ["google", "cpc"],
  fbclid: ["facebook", "social"],
  msclkid: ["bing", "cpc"],
  ttclid: ["tiktok", "cpc"],
  li_fat_id: ["linkedin", "cpc"],
};

function refDomain(ref: string): string {
  if (!ref) return "";
  try {
    const u = new URL(ref);
    if (u.protocol === "android-app:") return ANDROID_APPS[u.hostname] ?? u.hostname;
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

const SELF = /(^|\.)andreaeboli\.com$|^localhost$|^127\.0\.0\.1$|(^|\.)github\.io$/;

function classify(input: Incoming) {
  const utm = input.utm ?? {};
  const source = clean(utm.source, 100).toLowerCase();
  const domain = refDomain(clean(input.ref, 500));
  const ref = domain && !SELF.test(domain) ? domain : "";
  const extra = {
    cmp: clean(utm.campaign, 150) || undefined,
    trm: clean(utm.term, 150) || undefined,
    cnt: clean(utm.content, 150) || undefined,
    ref: ref || undefined,
  };

  if (source) {
    return { src: source, med: clean(utm.medium, 100).toLowerCase() || "(não informado)", ...extra };
  }
  const clid = CLICK_IDS[clean(input.clid, 20)];
  if (clid) return { src: clid[0], med: clid[1], ...extra };
  if (ref) {
    for (const [re, src, med] of REFERRERS) if (re.test(ref)) return { src, med, ...extra };
    return { src: ref, med: "referencia", ...extra };
  }
  return { src: "(direto)", med: "(nenhum)", ...extra };
}

// ---------------------------------------------------------------------------
// Gravação
// ---------------------------------------------------------------------------

const dayFile = (isoDay: string) => path.join(DATA_DIR, `events-${isoDay}.jsonl`);

let dirReady: Promise<unknown> | null = null;

async function append(ev: StoredEvent) {
  dirReady ??= mkdir(DATA_DIR, { recursive: true });
  await dirReady;
  const file = dayFile(ev.t.slice(0, 10)); // o nome do arquivo é o dia em UTC
  const size = await stat(file).then((s) => s.size, () => 0);
  if (size > MAX_DAY_FILE) return;
  await appendFile(file, JSON.stringify(ev) + "\n", "utf8");
}

// Limite por IP, só em memória: 120 páginas vistas por minuto é muito mais do
// que uma pessoa lendo, e bem menos do que um robô martelando.
const hits = new Map<string, { n: number; since: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.since > 60_000) {
    hits.set(ip, { n: 1, since: now });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  h.n++;
  return h.n > 120;
}

/** POST /track — público. Sempre responde 204: o site não espera nada. */
export const handleTrack: Handler = async (req) => {
  const done = () => new Response(null, { status: 204 });
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT_RE.test(ua)) return done();

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "?";
  if (limited(ip)) return done();

  let body: Incoming;
  try {
    const text = await req.text();
    if (text.length > 4000) return done();
    body = JSON.parse(text) as Incoming;
  } catch {
    return done();
  }

  const sid = clean(body.sid, 40);
  const p = clean(body.path, 300);
  if (!/^[a-z0-9]{8,40}$/i.test(sid) || !p.startsWith("/")) return done();

  const ev: StoredEvent = {
    t: new Date().toISOString(),
    sid,
    p: p.replace(/\/+$/, "") || "/",
    l: ["pt", "en", "es"].includes(clean(body.locale, 5)) ? clean(body.locale, 5) : undefined,
    n: body.landing === true ? 1 : undefined,
    ...classify(body),
    dev: deviceOf(ua),
  };

  try {
    await append(ev);
  } catch (err) {
    console.error("[track] não consegui gravar:", err instanceof Error ? err.message : err);
  }
  return done();
};

// ---------------------------------------------------------------------------
// Leitura e agregação
// ---------------------------------------------------------------------------

const dayInTz = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

/** Os eventos entre `from` e `to` (dias de São Paulo, inclusive). */
async function readEvents(from: string, to: string): Promise<StoredEvent[]> {
  // O arquivo é por dia UTC; São Paulo está 3 h atrás, então o dia local
  // atravessa dois arquivos. Lê um a mais de cada lado e filtra pela data local.
  const start = new Date(`${from}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 1);
  const end = new Date(`${to}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 1);

  const out: StoredEvent[] = [];
  for (const d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const raw = await readFile(dayFile(d.toISOString().slice(0, 10)), "utf8").catch(() => "");
    for (const line of raw.split("\n")) {
      if (!line) continue;
      try {
        const ev = JSON.parse(line) as StoredEvent;
        const local = dayInTz(new Date(ev.t));
        if (local >= from && local <= to) out.push(ev);
      } catch {
        // linha cortada (gravação interrompida): ignora e segue
      }
    }
  }
  return out;
}

type Session = {
  sid: string;
  start: string;
  day: string;
  src: string;
  med: string;
  cmp?: string;
  trm?: string;
  cnt?: string;
  ref?: string;
  dev: StoredEvent["dev"];
  l?: string;
  landing: string;
  pages: number;
};

function sessionsOf(events: StoredEvent[]): Session[] {
  const byId = new Map<string, Session>();
  const sorted = [...events].sort((a, b) => a.t.localeCompare(b.t));
  for (const ev of sorted) {
    const s = byId.get(ev.sid);
    if (s) {
      s.pages++;
      continue;
    }
    // A atribuição da sessão é a da PRIMEIRA página vista (a de entrada).
    byId.set(ev.sid, {
      sid: ev.sid,
      start: ev.t,
      day: dayInTz(new Date(ev.t)),
      src: ev.src,
      med: ev.med,
      cmp: ev.cmp,
      trm: ev.trm,
      cnt: ev.cnt,
      ref: ev.ref,
      dev: ev.dev,
      l: ev.l,
      landing: ev.p,
      pages: 1,
    });
  }
  return [...byId.values()];
}

type Row = { key: string; sessions: number; pageviews: number };

function breakdown(sessions: Session[], pick: (s: Session) => string | undefined, limit = 50): Row[] {
  const m = new Map<string, Row>();
  for (const s of sessions) {
    const key = pick(s);
    if (!key) continue;
    const r = m.get(key) ?? { key, sessions: 0, pageviews: 0 };
    r.sessions++;
    r.pageviews += s.pages;
    m.set(key, r);
  }
  return [...m.values()].sort((a, b) => b.sessions - a.sessions || b.pageviews - a.pageviews).slice(0, limit);
}

function period(days: number, endOffset = 0) {
  const to = new Date();
  to.setUTCDate(to.getUTCDate() - endOffset);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (days - 1));
  return { from: dayInTz(from), to: dayInTz(to) };
}

function readDays(req: Request): number {
  const n = Number(new URL(req.url).searchParams.get("days"));
  return Number.isFinite(n) && n >= 1 ? Math.min(Math.floor(n), 366) : 30;
}

async function requireReader(req: Request) {
  // Quem vê o painel de acessos: qualquer membro do projeto, inclusive quem
  // só tem leitura (os números não gastam crédito nem mudam conteúdo).
  return requireMember(req, { allowViewer: true });
}

/** GET /track/summary?days=30 */
export const handleTrackSummary: Handler = async (req) => {
  const auth = await requireReader(req);
  if (!auth.ok) return authFailure(auth);

  const days = readDays(req);
  const cur = period(days);
  const prev = period(days, days);
  const [events, prevEvents] = await Promise.all([
    readEvents(cur.from, cur.to),
    readEvents(prev.from, prev.to),
  ]);
  const sessions = sessionsOf(events);
  const prevSessions = sessionsOf(prevEvents);

  // Série diária com os dias sem visita incluídos (zero é informação).
  const daily: Array<{ day: string; sessions: number; pageviews: number }> = [];
  const perDay = new Map<string, { sessions: number; pageviews: number }>();
  for (const s of sessions) {
    const d = perDay.get(s.day) ?? { sessions: 0, pageviews: 0 };
    d.sessions++;
    d.pageviews += s.pages;
    perDay.set(s.day, d);
  }
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const day = dayInTz(d);
    if (daily.some((x) => x.day === day)) continue;
    daily.push({ day, ...(perDay.get(day) ?? { sessions: 0, pageviews: 0 }) });
  }

  const pageviews = events.length;
  const bounces = sessions.filter((s) => s.pages === 1).length;
  const pageRows = new Map<string, number>();
  for (const ev of events) pageRows.set(ev.p, (pageRows.get(ev.p) ?? 0) + 1);

  return Response.json({
    range: { ...cur, days, timezone: TZ },
    previousRange: prev,
    totals: {
      sessions: sessions.length,
      pageviews,
      pagesPerSession: sessions.length ? pageviews / sessions.length : 0,
      bounceRate: sessions.length ? bounces / sessions.length : 0,
      withCampaign: sessions.filter((s) => s.cmp).length,
    },
    previous: { sessions: prevSessions.length, pageviews: prevEvents.length },
    daily,
    bySourceMedium: breakdown(sessions, (s) => `${s.src} / ${s.med}`),
    bySource: breakdown(sessions, (s) => s.src),
    byMedium: breakdown(sessions, (s) => s.med),
    byCampaign: breakdown(sessions, (s) => s.cmp),
    byTerm: breakdown(sessions, (s) => s.trm),
    byContent: breakdown(sessions, (s) => s.cnt),
    byReferrer: breakdown(sessions, (s) => s.ref),
    byLanding: breakdown(sessions, (s) => s.landing),
    byDevice: breakdown(sessions, (s) => s.dev),
    byLocale: breakdown(sessions, (s) => s.l),
    topPages: [...pageRows.entries()]
      .map(([key, views]) => ({ key, pageviews: views }))
      .sort((a, b) => b.pageviews - a.pageviews)
      .slice(0, 50),
    recent: sessions
      .sort((a, b) => b.start.localeCompare(a.start))
      .slice(0, 50)
      // Sem o id da sessão: o painel não precisa dele.
      .map((s) => ({
        start: s.start, src: s.src, med: s.med, cmp: s.cmp, trm: s.trm,
        ref: s.ref, landing: s.landing, pages: s.pages, dev: s.dev,
      })),
  });
};

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** GET /track/export?days=30 — uma linha por sessão, para planilha. */
export const handleTrackExport: Handler = async (req) => {
  const auth = await requireReader(req);
  if (!auth.ok) return authFailure(auth);

  const days = readDays(req);
  const { from, to } = period(days);
  const sessions = sessionsOf(await readEvents(from, to)).sort((a, b) => a.start.localeCompare(b.start));
  const head = ["inicio", "dia", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "site_de_origem", "pagina_de_entrada", "paginas_vistas", "dispositivo", "idioma"];
  const lines = sessions.map((s) =>
    [s.start, s.day, s.src, s.med, s.cmp, s.trm, s.cnt, s.ref, s.landing, s.pages, s.dev, s.l].map(csvCell).join(","),
  );
  // BOM no início: sem ele o Excel abre o CSV com os acentos quebrados.
  return new Response("﻿" + [head.join(","), ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="acessos-${from}-a-${to}.csv"`,
    },
  });
};
