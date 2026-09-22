// Autenticação das rotas de ingestão: quem chama tem de ser MEMBRO do projeto
// no Sanity. Vale tanto no `npm run dev` (rotas do Next) quanto no serviço Node
// hospedado no cPanel (servidor-ingest/), que compartilham este módulo.
//
// COMO FUNCIONA
// O Studio já tem uma sessão autenticada. No modo de login padrão da Sanity
// ("dual"), depois do login o token de sessão fica guardado no navegador
// (localStorage `__studio_auth_token_<projectId>`) e o cliente do Studio o
// manda em todas as chamadas. A ferramenta "Importar de link" repassa esse
// mesmo token para cá em `Authorization: Bearer …`, e aqui perguntamos à
// própria Sanity quem é o dono dele:
//
//   GET https://<projectId>.api.sanity.io/v<apiVersion>/users/me
//
// Medido em 21/09/2026 (ver .claude/MEMORIA-PROJETO.md):
//   · token válido de membro   → 200 com `id`, `role` e `roles[]` DO PROJETO
//   · token inválido/expirado  → 401 "Session not found"
//   · SEM token                → 200 com `{}` (por isso `id` é obrigatório)
// O host com o projectId importa: o `api.sanity.io` genérico devolve o usuário
// mas NÃO o papel dele neste projeto.
//
// POR QUE ISTO SUBSTITUI O `INGEST_API_SECRET`
// A guarda antiga era um segredo em variável `NEXT_PUBLIC_*`, isto é, escrito
// no bundle do navegador e legível por qualquer pessoa que abrisse o painel.
// Em localhost tanto faz; num endpoint público em andreaeboli.com/api seria
// "qualquer um gasta os créditos da Anthropic". Agora não há segredo no
// cliente: o que se manda é a sessão da pessoa, e a Sanity diz se ela existe.
//
// Nenhum token é gravado em log. O cache guarda o resultado da verificação por
// alguns minutos, indexado pelo token, para não bater na Sanity a cada clique.

import { apiVersion, projectId } from "@/sanity/env";

export type SanityUser = {
  id: string;
  name?: string;
  email?: string;
  role: string;
  roles: string[];
};

export type AuthResult =
  | { ok: true; user: SanityUser }
  | { ok: false; status: 401 | 403 | 503; error: string; message: string };

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { user: SanityUser; expiresAt: number }>();

// Quem pode usar a ingestão. `viewer` fica de fora de propósito: esse papel
// não consegue gravar rascunho, então a geração só gastaria créditos à toa.
const ALLOWED_ROLES = new Set(["administrator", "editor", "developer", "contributor"]);

function bearerToken(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  const m = header.match(/^Bearer\s+(\S+)$/i);
  return m ? m[1] : null;
}

type UsersMe = {
  id?: string;
  name?: string;
  email?: string;
  role?: string | null;
  roles?: Array<{ name?: string }>;
};

async function askSanity(token: string): Promise<AuthResult> {
  let res: Response;
  try {
    res = await fetch(
      `https://${projectId}.api.sanity.io/v${apiVersion}/users/me`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
  } catch {
    return {
      ok: false,
      status: 503,
      error: "auth_unavailable",
      message: "Não foi possível confirmar a sessão junto ao Sanity. Tente de novo.",
    };
  }

  if (res.status === 401 || res.status === 403) {
    return {
      ok: false,
      status: 401,
      error: "unauthorized",
      message: "Sessão inválida ou expirada. Entre de novo no painel.",
    };
  }
  if (!res.ok) {
    return {
      ok: false,
      status: 503,
      error: "auth_unavailable",
      message: `O Sanity respondeu HTTP ${res.status} ao confirmar a sessão.`,
    };
  }

  const me = (await res.json().catch(() => ({}))) as UsersMe;
  const roles = (me.roles ?? [])
    .map((r) => r.name)
    .filter((n): n is string => Boolean(n));
  const role = me.role ?? roles[0];

  // `{}` = a Sanity não reconheceu ninguém (é o que volta sem token).
  if (!me.id || !role) {
    return {
      ok: false,
      status: 401,
      error: "unauthorized",
      message: "Sessão não reconhecida. Entre de novo no painel.",
    };
  }
  if (!ALLOWED_ROLES.has(role) && !roles.some((r) => ALLOWED_ROLES.has(r))) {
    return {
      ok: false,
      status: 403,
      error: "forbidden",
      message: `O papel "${role}" não pode importar conteúdo.`,
    };
  }

  return {
    ok: true,
    user: { id: me.id, name: me.name, email: me.email, role, roles },
  };
}

/**
 * Confere a sessão de quem chama. Uso: `const auth = await requireMember(req);
 * if (!auth.ok) return unauthorized(auth);`
 */
export async function requireMember(req: Request): Promise<AuthResult> {
  const token = bearerToken(req);
  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "unauthorized",
      message: "Chamada sem sessão do painel.",
    };
  }

  const now = Date.now();
  const hit = cache.get(token);
  if (hit && hit.expiresAt > now) return { ok: true, user: hit.user };

  const result = await askSanity(token);
  if (result.ok) {
    cache.set(token, { user: result.user, expiresAt: now + CACHE_TTL_MS });
    // Sem crescer para sempre: descarta entradas vencidas de vez em quando.
    if (cache.size > 200) {
      for (const [k, v] of cache) if (v.expiresAt <= now) cache.delete(k);
    }
  }
  return result;
}

/** Resposta JSON padrão para uma verificação que falhou. */
export function authFailure(result: Extract<AuthResult, { ok: false }>): Response {
  return Response.json(
    { error: result.error, message: result.message },
    { status: result.status },
  );
}
