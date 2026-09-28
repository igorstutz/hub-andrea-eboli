// Inscrições na newsletter "Notas sobre Poder", gravadas pela própria
// hospedagem (28/09/2026).
//
// 🔴 POR QUE AQUI: o formulário do site sempre mandou para /api/newsletter, mas
// essa rota só existia no `npm run dev` (Next). No ar, /api é o serviço Node do
// cPanel, que não a tinha: toda inscrição voltava erro. Ainda não há provedor
// de e-mail escolhido, então o e-mail fica guardado na hospedagem (como os
// acessos, ver src/lib/analytics/track.ts) e a lista sai no painel, em Acessos,
// com planilha. Se um dia houver provedor, NEWSLETTER_WEBHOOK_URL também recebe
// cada inscrição.
//
//   POST /newsletter         → público; o formulário do site
//   GET  /newsletter/list    → sessão do painel; total + últimas inscrições
//   GET  /newsletter/export  → sessão do painel; todas em CSV
//
// ONDE FICA: `NEWSLETTER_DATA_DIR`, ou `~/andrea-newsletter` no ar. FORA de
// public_html de propósito: o envio do serviço por FTP sincroniza a pasta do
// app, e a lista não pode morar onde um deploy mexe (nem ser lida por HTTP).
//
// Nada aqui pode importar de "next/*": roda também no serviço do cPanel.

import { appendFile, mkdir, readFile, stat } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { authFailure, requireMember } from "@/lib/ingest/auth";

type Handler = (req: Request) => Promise<Response>;

const DATA_DIR =
  process.env.NEWSLETTER_DATA_DIR ||
  (process.env.NODE_ENV === "production"
    ? path.join(homedir(), "andrea-newsletter")
    : path.join(tmpdir(), "andrea-newsletter-dev"));
const FILE = path.join(DATA_DIR, "inscritos.jsonl");
// Protege o disco se alguém martelar o endpoint (5 MB ≈ 40 mil inscrições).
const MAX_FILE = 5 * 1024 * 1024;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

type Signup = { t: string; email: string; l?: string; p?: string };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

// Limite por IP, só em memória: 10 inscrições por minuto é muito para uma
// pessoa e pouco para um robô.
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
  return h.n > 10;
}

async function readAll(): Promise<Signup[]> {
  const text = await readFile(FILE, "utf8").catch(() => "");
  const seen = new Set<string>();
  const out: Signup[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      const s = JSON.parse(line) as Signup;
      // A mesma pessoa pode se inscrever duas vezes: vale a primeira.
      if (!s.email || seen.has(s.email)) continue;
      seen.add(s.email);
      out.push(s);
    } catch {
      /* linha quebrada: ignora */
    }
  }
  return out;
}

/** POST /newsletter — público. */
export const handleNewsletter: Handler = async (req) => {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "?";
  if (limited(ip)) return json({ error: "too_many" }, 429);

  let body: { email?: unknown; locale?: unknown; path?: unknown; website?: unknown };
  try {
    const text = await req.text();
    if (text.length > 2000) return json({ error: "bad_request" }, 400);
    body = JSON.parse(text);
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  // Campo-isca invisível no formulário: gente não preenche, robô sim.
  if (typeof body.website === "string" && body.website.trim()) return json({ ok: true });

  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 200);
  if (!EMAIL_RE.test(email)) return json({ error: "invalid_email" }, 400);

  const locale = String(body.locale ?? "");
  const signup: Signup = {
    t: new Date().toISOString(),
    email,
    l: ["pt", "en", "es"].includes(locale) ? locale : undefined,
    p: typeof body.path === "string" && body.path.startsWith("/") ? body.path.slice(0, 200) : undefined,
  };

  try {
    await mkdir(DATA_DIR, { recursive: true });
    const size = await stat(FILE).then((s) => s.size, () => 0);
    if (size > MAX_FILE) return json({ error: "full" }, 503);
    await appendFile(FILE, JSON.stringify(signup) + "\n", "utf8");
  } catch (err) {
    console.error("[newsletter] não consegui gravar:", err instanceof Error ? err.message : err);
    return json({ error: "storage" }, 500);
  }

  const hook = process.env.NEWSLETTER_WEBHOOK_URL;
  if (hook) {
    // O e-mail já está guardado; falha no provedor não vira erro para a pessoa.
    await fetch(hook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
      signal: AbortSignal.timeout(10_000),
    }).catch((err) => console.error("[newsletter] webhook falhou:", err instanceof Error ? err.message : err));
  }

  return json({ ok: true });
};

/** GET /newsletter/list — total e as 100 inscrições mais recentes. */
export const handleNewsletterList: Handler = async (req) => {
  const auth = await requireMember(req, { allowViewer: true });
  if (!auth.ok) return authFailure(auth);
  const all = await readAll();
  return json({ total: all.length, recent: all.slice(-100).reverse() });
};

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** GET /newsletter/export — todas as inscrições, para planilha. */
export const handleNewsletterExport: Handler = async (req) => {
  const auth = await requireMember(req, { allowViewer: true });
  if (!auth.ok) return authFailure(auth);
  const all = await readAll();
  const lines = all.map((s) => [s.t, s.email, s.l, s.p].map(csvCell).join(","));
  // BOM no início: sem ele o Excel abre o CSV com os acentos quebrados.
  return new Response("﻿" + ["data,email,idioma,pagina", ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="newsletter-inscritos.csv"',
      "Cache-Control": "no-store",
    },
  });
};
