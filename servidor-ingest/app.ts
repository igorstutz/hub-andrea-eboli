// O serviço de ingestão que roda NA HOSPEDAGEM (cPanel → "Setup Node.js App").
//
// É o que faz a ferramenta "Importar de link" funcionar no painel publicado em
// andreaeboli.com/admin: o site é estático, então as rotas de src/app/api não
// existem no ar. Este arquivo é empacotado por `node build-api.mjs` num único
// dist-api/app.js, sem node_modules, e publicado pelo modo `enviar-api` do
// workflow de deploy. O guia de configuração do cPanel está em
// deploy/API-CPANEL.md.
//
// O QUE ELE FAZ
// Um servidor HTTP do próprio Node que converte cada requisição em `Request`
// do padrão web, entrega ao handler certo (src/lib/ingest/handlers.ts — o
// MESMO código que as rotas do Next usam no `npm run dev`) e escreve a
// `Response` de volta. Nada de framework: é a única dependência que não há.
//
// CAMINHOS
// O app é montado em andreaeboli.com/api (Application URL do cPanel). O
// Passenger/LiteSpeed pode ou não remover o prefixo `/api` antes de repassar a
// requisição — a documentação não é categórica — então o roteamento aceita as
// duas formas: `/api/ingest/health` e `/ingest/health` caem no mesmo lugar.
//
// PORTA
// `listen()` numa porta qualquer. O Passenger (e o LiteSpeed em modo
// compatível) intercepta o listen e liga o app ao próprio socket dele; a porta
// só vale quando o arquivo é rodado à mão (`PORT=8787 node dist-api/app.js`).
//
// CORS
// Chamadas do painel em andreaeboli.com/admin são do MESMO domínio, então não
// há CORS. A lista abaixo existe para o painel de reserva
// (andreaeboli.sanity.studio) e para o dev local apontarem para cá se um dia
// for preciso. Origens fora da lista recebem a resposta sem os cabeçalhos CORS
// e o navegador a descarta.

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import {
  handleGenerate,
  handleHealth,
  handleTranscribe,
  handleWebInspect,
  handleYouTubeInspect,
  type Handler,
} from "@/lib/ingest/handlers";

const ROUTES: Record<string, Handler> = {
  "GET /ingest/health": handleHealth,
  "POST /ingest/youtube/inspect": handleYouTubeInspect,
  "POST /ingest/youtube/transcribe": handleTranscribe,
  "POST /ingest/web/inspect": handleWebInspect,
  "POST /ingest/generate": handleGenerate,
};

const DEFAULT_ORIGINS = ["https://andreaeboli.sanity.studio"];
const ALLOWED_ORIGINS = new Set([
  ...DEFAULT_ORIGINS,
  ...(process.env.INGEST_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
]);

// Corpo máximo aceito. O maior payload real é a transcrição de um vídeo longo
// (algumas centenas de KB); 8 MB é folga, não meta.
const MAX_BODY = 8 * 1024 * 1024;

// `/api/ingest/x`, `/ingest/x/`, `//ingest/x` → `/ingest/x`
function normalizePath(raw: string): string {
  const pathname = new URL(raw, "http://x").pathname;
  return pathname
    .replace(/\/{2,}/g, "/")
    .replace(/^\/api(?=\/|$)/, "")
    .replace(/\/+$/, "") || "/";
}

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error("payload_too_large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function toRequest(req: IncomingMessage, body: Buffer): Request {
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) for (const item of v) headers.append(k, item);
    else headers.set(k, v);
  }
  const proto = (req.headers["x-forwarded-proto"] as string) || "http";
  const host = req.headers.host || "localhost";
  const method = req.method || "GET";
  // `Buffer` não é `BodyInit` para o TypeScript (lib dom), e um Uint8Array
  // sobre o mesmo ArrayBufferLike também não (TS 5.7+ exige ArrayBuffer puro).
  // Copiar para um Uint8Array novo resolve os dois; os corpos são pequenos.
  const bytes = new Uint8Array(body.byteLength);
  bytes.set(body);
  return new Request(`${proto}://${host}${req.url || "/"}`, {
    method,
    headers,
    body: method === "GET" || method === "HEAD" ? undefined : bytes,
  });
}

function corsHeaders(origin: string | undefined): Record<string, string> {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

async function writeResponse(
  res: ServerResponse,
  response: Response,
  extra: Record<string, string>,
) {
  const headers: Record<string, string> = { ...extra };
  response.headers.forEach((v, k) => {
    headers[k] = v;
  });
  // Respostas da API nunca são cacheáveis.
  headers["Cache-Control"] = "no-store";
  const buf = Buffer.from(await response.arrayBuffer());
  headers["Content-Length"] = String(buf.length);
  res.writeHead(response.status, headers);
  res.end(buf);
}

function jsonResponse(body: unknown, status: number): Response {
  return Response.json(body, { status });
}

const server = createServer(async (req, res) => {
  const started = Date.now();
  const method = (req.method || "GET").toUpperCase();
  const path = normalizePath(req.url || "/");
  const cors = corsHeaders(req.headers.origin);

  // Preflight do CORS (só chega de origem externa).
  if (method === "OPTIONS") {
    res.writeHead(Object.keys(cors).length ? 204 : 403, cors);
    res.end();
    return;
  }

  let response: Response;
  try {
    const handler = ROUTES[`${method} ${path}`];
    if (!handler) {
      response = jsonResponse({ error: "not_found", path }, 404);
    } else {
      const body = method === "GET" || method === "HEAD" ? Buffer.alloc(0) : await readBody(req);
      response = await handler(toRequest(req, body));
    }
  } catch (err) {
    const tooLarge = err instanceof Error && err.message === "payload_too_large";
    response = tooLarge
      ? jsonResponse({ error: "payload_too_large" }, 413)
      : jsonResponse({ error: "internal_error" }, 500);
    if (!tooLarge) console.error("[ingest] erro não tratado:", err);
  }

  await writeResponse(res, response, cors);

  // Log sem cabeçalhos (o Authorization passa por aqui) e sem corpo.
  console.log(
    `[ingest] ${method} ${path} → ${response.status} (${Date.now() - started} ms)`,
  );
});

// Uma geração com IA pode levar de 1 a 3 minutos. Os limites abaixo valem para
// o servidor do Node; o que o Passenger/LiteSpeed permite por cima é assunto
// de deploy/API-CPANEL.md.
server.requestTimeout = 10 * 60 * 1000;
server.headersTimeout = 65 * 1000;
server.keepAliveTimeout = 5 * 1000;

const port = Number(process.env.PORT) || 3001;
server.listen(port, () => {
  console.log(
    `[ingest] serviço de ingestão de pé · porta ${port} · build ${process.env.INGEST_BUILD || "dev"} · node ${process.version}`,
  );
});
