---
name: ingestao-de-links
description: Como funciona a ferramenta "Importar de link" do Studio (YouTube, Forbes, LinkedIn) que gera rascunhos trilíngues com IA — matriz fonte × tipo, handlers compartilhados entre o Next (dev) e o serviço Node do cPanel (produção, andreaeboli.com/api), autenticação pela sessão do Sanity, transcrição (yt-dlp local / Supadata no servidor / Whisper), painel "Agentes de IA" e variáveis de ambiente. Use ao mexer em src/lib/ai, src/lib/ingest, src/lib/transcribe, src/app/api/ingest, servidor-ingest/, build-api.mjs ou na IngestTool do Sanity.
---

# Ingestão de LINKS → conteúdo (IA)

> ⚠️ Reestruturada em 06/08/2026 (3 fontes, cada uma gera os seus tipos) e
> **hospedada em 21/09/2026**: a lógica saiu das rotas do Next para handlers
> neutros, que rodam também num serviço Node no cPanel. Guia de configuração
> da hospedagem em `deploy/API-CPANEL.md`.

Ferramenta no Studio (**"Importar de link"**, ícone de corrente) que, a partir de
uma URL, extrai o material e gera **rascunhos trilíngues** (pt/en/es) via Claude.
Fluxo em 2 etapas: colar link → "Buscar" (preview) → escolher o que gerar →
"Gerar rascunhos".

| Fonte | Material | Gera |
|---|---|---|
| YouTube | transcrição (legendas; Whisper só no dev) | vídeo+resumo, perguntas, artigo |
| Forbes | texto da página (extração automática funciona) | perguntas, artigo |
| LinkedIn | texto **colado à mão** (LinkedIn bloqueia robô — HTTP 999) | perguntas, artigo |

**Conceitos NÃO são gerados por link** em nenhuma fonte — entram à mão no Studio.
A matriz fonte × tipo mora em `src/lib/ingest/sources.ts` (usada pela ferramenta e
conferida de novo no servidor).

## Arquitetura (desde 21/09/2026)

```
IngestTool.tsx (Studio)  ──►  {API_BASE}/ingest/…   API_BASE = SANITY_STUDIO_INGEST_API_URL || "/api"
                                   │
          ┌────────────────────────┴─────────────────────────┐
   npm run dev                                        andreaeboli.com/api
   src/app/api/ingest/*/route.ts                      servidor-ingest/app.ts → dist-api/app.js
   (invólucros: `export const POST = handleX`)        (http do Node → Request/Response)
          └────────────────────────┬─────────────────────────┘
                     src/lib/ingest/handlers.ts  ← a lógica, UMA vez
                     src/lib/ingest/auth.ts      ← quem chama é membro do projeto?
```

- **Handlers neutros** (`(Request) => Promise<Response>`) em
  `src/lib/ingest/handlers.ts`: `handleHealth`, `handleYouTubeInspect`,
  `handleWebInspect`, `handleTranscribe`, `handleGenerate`. **Nada ali importa
  de `next/*`** (o Sanity client vem de `@sanity/client`, não de `next-sanity`).
- **Serviço do cPanel:** `servidor-ingest/app.ts`, empacotado por
  `node build-api.mjs` num único `dist-api/app.js` (esbuild, CommonJS, alvo
  Node 18, sem node_modules). Aceita o caminho com ou sem o prefixo `/api`
  (o Passenger repassa o caminho completo em sub-URI). CORS só para a lista
  `INGEST_ALLOWED_ORIGINS` + `https://andreaeboli.sanity.studio`; o painel em
  andreaeboli.com/admin é mesmo domínio. Publicado pelo modo **`enviar-api`**
  do workflow para `public_html/ingest-api/` com a conta de FTP do site
  (`dist-api/.htaccess` nega acesso HTTP à pasta; `tmp/restart.txt` faz o
  Passenger reiniciar).
- **Autenticação — sem segredo no navegador.** A ferramenta manda o token de
  sessão do Studio (`client.config().token`; no modo de login padrão `dual`,
  a Sanity guarda o token no localStorage `__studio_auth_token_<projectId>`
  depois do login). O serviço chama
  `https://<projectId>.api.sanity.io/v<apiVersion>/users/me` e exige `id` +
  papel de escrita (`administrator`/`editor`/`developer`/`contributor`);
  `viewer` = 403; sem token ou token inválido = 401. Cache de 5 min por token.
  Medido: sem token esse endpoint devolve **200 com `{}`**, por isso `id` é
  obrigatório. O antigo `INGEST_API_SECRET`/`NEXT_PUBLIC_INGEST_API_SECRET`
  **não existe mais**.
- **Visibilidade da ferramenta** (`temServicoDeIngestao` em
  `sanity.config.ts`): aparece em localhost (dev) ou quando o bundle foi
  buildado com `SANITY_STUDIO_INGEST_API_URL` (o `build-painel.mjs` grava
  `/api` e confere que "Importar de link" está no bundle). Um destino novo
  nasce sem a ferramenta. Ao abrir, a ferramenta sonda `GET /ingest/health` e
  mostra na tela se o serviço está fora ou sem a chave da Anthropic.
- **Gravação dos rascunhos é client-side, pela sessão do Studio**
  (`client.transaction().createOrReplace`), com `_id` `drafts.*` e referências
  fracas. O serviço só devolve os documentos prontos. Link "abrir rascunho"
  usa o `basePath` do workspace (`/admin`).
- Modelo: `claude-opus-4-8` (configurável via `ANTHROPIC_MODEL` **ou pelo
  painel**), saída estruturada (JSON Schema) + streaming. SDK: `@anthropic-ai/sdk`.
- **Agentes de IA configuráveis pelo painel** (singleton `aiSettings`, item
  "⚙️ Agentes de IA" no Studio): voz/persona + instruções por tipo + modelo +
  esforço + quantidade padrão de perguntas. `handleGenerate` lê o singleton
  com cliente sem CDN. Campos vazios caem em `DEFAULT_VOICE`/`STRUCTURAL_RULES`/
  `DEFAULT_INSTRUCTIONS` (`src/lib/ai/generate.ts`). Regras técnicas fixas.
- **Direcionamentos pontuais:** campo `directions` da ferramenta, injetado só
  naquela geração.
- **Fonte já publicada (Forbes/LinkedIn):** `REPUBLISH_RULE` exige texto novo.
- Conversão texto→Portable Text em `src/lib/portableText.ts`.

## Transcrição (`src/lib/transcribe.ts`)

Provedor escolhido por **`TRANSCRIPT_PROVIDER`**:

| Provedor | Onde | Como | Custo |
|---|---|---|---|
| `ytdlp` (padrão) | dev local | `python -m yt_dlp --write-auto-subs …` (json3) | grátis |
| `supadata` | serviço no cPanel | `GET https://api.supadata.ai/v1/transcript?url=…&lang=pt&text=true&mode=native`, header `x-api-key` | 1 crédito/legenda; 100 grátis/mês; pago a partir de US$ 5/mês |

- 🔴 **yt-dlp em IP de datacenter não funciona** ("Sign in to confirm you're
  not a bot", medido em 09/09/2026). Em **21/09/2026 a mesma barreira apareceu
  na máquina do Igor**, mesmo com o yt-dlp atualizado — ver a sessão na
  memória do projeto. O serviço degrada: `transcriptAvailable: false`.
- Supadata `mode=native` **de propósito**: `auto` transcreve por IA a 2
  créditos POR MINUTO quando não há legenda. `SUPADATA_MODE=auto` liga isso
  conscientemente. 206 = sem legenda (cobra 1 crédito). Se a legenda voltar em
  idioma fora de pt/en/es e houver um desses em `availableLangs`, o código faz
  uma segunda chamada (1 crédito) pelo idioma preferido.
- **Metadados pela Supadata** (`fetchYouTubeMetadataRemote`, `GET /metadata?url=…`,
  1 crédito): só quando a página `watch` do YouTube não responde (em servidor,
  sempre). Traz título, descrição (de onde saem os capítulos), autor, duração e
  data. Nunca lança. Os endpoints `/youtube/*` da Supadata estão `deprecated`;
  usar sempre os universais `/transcript` e `/metadata`.
- **Whisper (OpenAI)** = transcrição do ÁUDIO, reserva para vídeo sem legenda.
  Baixa o áudio com yt-dlp e fatia com ffmpeg → **só existe onde o provedor é
  `ytdlp`** (`whisperAvailable()`); `handleTranscribe` responde 501 fora daí e
  o botão nem aparece no painel publicado.

## Variáveis de ambiente

Valem no `.env.local` (dev) **e** na tela "Setup Node.js App" do cPanel
(serviço). Lista comentada em `.env.example`:
`ANTHROPIC_API_KEY` (obrigatória), `ANTHROPIC_MODEL`, `TRANSCRIPT_PROVIDER`,
`SUPADATA_API_KEY`, `SUPADATA_MODE`, `YTDLP_CMD`, `OPENAI_API_KEY`,
`OPENAI_TRANSCRIBE_MODEL`, `OPENAI_TRANSCRIBE_LANG`, `INGEST_ALLOWED_ORIGINS`.
`INGEST_BUILD` é gravada pelo `build-api.mjs` (aparece no `/ingest/health`).

## Testar

- `npx tsc --noEmit` e `npx eslint …` limpos; `node build-api.mjs` confere que
  o bundle não importa `next/*`, tem as rotas e não contém assinatura de chave.
- `PORT=8787 node dist-api/app.js` → `curl localhost:8787/ingest/health`;
  `POST /ingest/generate` sem `Authorization` tem de dar **401**.
- Provas automatizadas usadas em 21/09/2026 (15 casos: rotas, prefixo `/api`,
  401/403/400, CORS, inspeção real): roteiro no histórico da sessão; o token
  de teste sai de `~/.config/sanity/config.json` (CLI), nunca é impresso.
