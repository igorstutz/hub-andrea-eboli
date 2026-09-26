import type { SanityClient } from "sanity";

// Como as ferramentas do painel falam com o serviço da hospedagem
// (andreaeboli.com/api): o endereço e a sessão. Compartilhado pela
// "Importar de link" e pela "Acessos".
//
// ONDE ESTÁ O SERVIÇO. No `npm run dev` são as rotas do Next em /api. No painel
// publicado (andreaeboli.com/admin) é o serviço Node do cPanel, montado no
// MESMO domínio em /api — por isso o padrão é um caminho relativo, sem CORS.
//
// COMO SE AUTENTICA. Não há segredo no navegador: vai o token de sessão que o
// próprio Studio já usa, e o serviço pergunta à Sanity quem é o dono dele (ver
// src/lib/ingest/auth.ts).

const API_BASE = (process.env.SANITY_STUDIO_INGEST_API_URL || "/api").replace(
  /\/+$/,
  "",
);

export function api(path: string): string {
  return `${API_BASE}${path}`;
}

function readStoredToken(projectId: string): string | null {
  try {
    const raw = window.localStorage.getItem(`__studio_auth_token_${projectId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string };
    return typeof parsed.token === "string" ? parsed.token : null;
  } catch {
    return null;
  }
}

// Cabeçalhos de uma chamada ao serviço: JSON + a sessão do Studio. Lido a cada
// chamada (e não uma vez), porque o token pode ser renovado durante a sessão.
export function apiHeaders(client: SanityClient): Record<string, string> {
  const cfg = client.config();
  const token = cfg.token ?? (cfg.projectId ? readStoredToken(cfg.projectId) : null);
  return {
    "content-type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
