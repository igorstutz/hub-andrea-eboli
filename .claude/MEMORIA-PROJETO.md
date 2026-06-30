# Memória do Projeto — Andrea Eboli Hub

> Documento de retomada. Leia isto primeiro ao reabrir o projeto para saber onde paramos.
> Atualize sempre que concluir uma etapa importante.

## O que é o projeto
Hub de Autoridade (SEO + GEO) para **Andrea Eboli** — site institucional/conteúdo
em **Next.js 16** + **Sanity v5** (CMS headless), **trilíngue** (pt / en / es, via `next-intl`).

- **Pasta oficial do projeto:** `andrea-eboli-hub` (esta pasta).
  - A pasta `Projeto Inicial` (irmã) foi onde tudo começou e contém a **proposta comercial**
    (HTMLs/PDFs) — não misturar com o código do produto.
- **Repositório da proposta:** `github.com/igorstutz/proposta-andrea-eboli` (fica na pasta `Projeto Inicial`).

## Sanity (CMS)
- **projectId:** `52ssivbg`
- **dataset:** `production`
- **apiVersion:** `2024-10-01`
- **Studio:** embutido no Next em `/studio` (ver `sanity.config.ts`).
- **Schema:** em `src/sanity/schemaTypes`. Tipos de conteúdo: `topic`, `concept`,
  `question`, `caseStudy`, `article`, e singletons `aboutPage` e `siteSettings`.

## Estado atual / onde paramos

### 🗓️ Sessão 24–25/06/2026 (mais recente) — Transcrição robusta + Agentes de IA configuráveis
**Contexto:** a ferramenta "Importar do YouTube" estava dando "Sem transcrição"
e o usuário (Igor) quis deixar a geração configurável pelo painel.

**O que foi feito (tudo CONCLUÍDO e validado — `tsc`/`eslint` OK):**
1. **Chaves configuradas no `.env.local`** (local, não versionado): `ANTHROPIC_API_KEY`
   e `OPENAI_API_KEY` (ambas validadas e funcionando).
2. **Transcrição reescrita** (`src/lib/transcribe.ts`): a raspagem direta de legendas
   morreu (YouTube exige PoToken → `timedtext` volta vazio). Agora: **yt-dlp** (legendas,
   padrão, grátis) + **Whisper/OpenAI** (áudio, reserva p/ vídeos sem legenda). Ambos
   testados de ponta a ponta. yt-dlp instalado via `pip` (`python -m yt_dlp`); ffmpeg já existia.
3. **Bugs corrigidos:** (a) checkbox lia `e.currentTarget` dentro do updater (null) →
   lê antes; (b) gravação no Sanity falhava por **referência forte** a doc inexistente
   → referências agora **`_weak: true`** + gravação em **transação única**; (c) `VideoEmbed`
   quebrava com `chapters` null (GROQ) → `chapters ?? []`.
4. **UX da ferramenta:** links dos rascunhos abrem em **nova aba** (↗) + botão
   **"Concluir e importar outro vídeo"** (reset).
5. **Agentes de IA configuráveis pelo painel** (singleton `aiSettings` — ver seção da
   funcionalidade abaixo): voz + instruções por tipo + modelo + esforço + quantidades,
   editável no Studio; + campo **"Direcionamentos específicos"** por geração.
6. **Conteúdo publicado** (via `publish-drafts.mjs`, sessão CLI do dono):
   2 vídeos + várias perguntas. Slugs têm sufixo aleatório (ex.: `...-67ab7`).

**⏭️ PRÓXIMOS PASSOS (retomar por aqui):**
- **TESTAR** o painel "⚙️ Agentes de IA" (publicar config) e o campo de direcionamentos
  ponta a ponta — foi implementado mas o usuário ainda não validou na interface.
- **DECISÃO PENDENTE — slugs:** Igor perguntou do sufixo `-67ab7`. Propus a **opção 2**
  (slugs limpos + sufixo só em caso de colisão); **aguardando o "ok" para implementar**
  em `makeSlug()` (`src/app/api/ingest/youtube/generate/route.ts`).
- **Verificar `/sobre`:** um rascunho da `aboutPage` foi publicado junto sem querer —
  conferir se ficou certo; se não, restaurar pelo histórico do Sanity.
- Sobrou 1 rascunho de `question` (`drafts.e8ebf006...`) — limpar/publicar se fizer sentido.
- Scripts auxiliares criados: `publish-drafts.mjs` e `check-drafts.mjs` (rodar com
  `npx sanity exec <arquivo> --with-user-token`).

> ⚠️ **Deploy:** yt-dlp e ffmpeg NÃO existem em serverless (Vercel) — rever antes de hospedar.

---

### 🗓️ Sessão anterior — Seed do Sanity
**Objetivo (CONCLUÍDO):** popular o dataset `production` do Sanity com conteúdo
de EXEMPLO trilíngue (script `seed.mjs`, 17 documentos idempotentes via `createOrReplace`).

Histórico:
1. Tentamos popular via **token de API** (`SANITY_WRITE_TOKEN`) → **não escrevia**
   (provável token sem permissão de escrita / não-Editor).
2. Decidimos usar o **Sanity CLI** logado com a **conta de dono** (escreve sem restrição).
3. O CLI exigia Node atualizado → **Node atualizado para v24.16.0 LTS** (npm 11.13.0). ✅
4. Caminho CLI montado:
   - Criado `sanity.cli.ts` (projectId/dataset) para o `sanity exec` funcionar.
   - `seed.mjs` adaptado: com token usa `@sanity/client`; sem token usa
     `getCliClient()` da sessão do CLI (`sanity exec --with-user-token`).
5. Login feito (`npx sanity login`) e seed rodado. ✅
6. Ajuste no seed: o commit passou a ser **uma única transação** (`client.transaction()`)
   porque havia referências "para frente" entre documentos (ex.: uma `question`
   referenciava outra ainda não criada) — em transação única o Sanity aceita.

### ✅ Resultado
17 documentos no dataset `production` (4 `topic`, 4 `concept`, 4 `question`,
2 `caseStudy`, 1 `article`, `aboutPage`, `siteSettings`). Conteúdo é **exemplo** —
a Andrea edita/substitui tudo pelo Studio. Rodar de novo é seguro (idempotente).

### ⏭️ PRÓXIMOS PASSOS (sugestões)
- Validar no Studio (`npm run dev` → `/studio`) e nas páginas do site (pt/en/es).
- Substituir o conteúdo de exemplo pelo conteúdo real da Andrea.
- (Opcional) Revisar/avançar o front-end das páginas que consomem esse conteúdo.

## Funcionalidade: Ingestão de vídeos do YouTube → conteúdo (IA)
Ferramenta no Studio (**"Importar do YouTube"**, ícone ▶) que, a partir de uma URL,
extrai metadados + transcrição e gera **rascunhos trilíngues** (pt/en/es) via Claude.
Fluxo em 2 etapas: colar link → "Buscar" (preview) → escolher o que gerar
(FAQ / Conceitos / Artigo / Resumo+vídeo, em qualquer combinação) → "Gerar rascunhos".

**Arquitetura / decisões:**
- Gravação dos rascunhos é feita **client-side pela sessão autenticada do Studio**
  (`useClient().createOrReplace`), com `_id` `drafts.*`. **NÃO** usa
  `SANITY_WRITE_TOKEN` (resolve de vez o problema histórico do token sem permissão).
- Backend só faz o que exige segredo: `src/app/api/ingest/youtube/inspect` (extração)
  e `.../generate` (chama o Claude e devolve documentos prontos do Sanity).
- Modelo: `claude-opus-4-8` (configurável via `ANTHROPIC_MODEL` **ou pelo painel**),
  saída estruturada (JSON Schema) + streaming. SDK: `@anthropic-ai/sdk`.
- **Agentes de IA configuráveis pelo painel** (singleton `aiSettings`, item
  "⚙️ Agentes de IA" no Studio): voz/persona geral + instruções por tipo
  (vídeo/FAQ/conceitos/artigo) + modelo + esforço + quantidades padrão. O endpoint
  `generate` lê esse singleton (cliente sem CDN, `cache: no-store`) e compõe o prompt;
  campos vazios caem em padrões embutidos (`DEFAULT_VOICE`/`STRUCTURAL_RULES`/
  `DEFAULT_INSTRUCTIONS` em `src/lib/ai/generate.ts`). As regras técnicas (3 idiomas,
  JSON, não inventar) são FIXAS e não editáveis. Vale após **Publicar** no Studio.
- **Direcionamentos pontuais:** campo livre na ferramenta "Importar do YouTube"
  (`directions`) injetado com prioridade alta no prompt só daquela geração.
- Transcrição (`src/lib/transcribe.ts`) — **2 camadas** (a raspagem direta de
  legendas morreu: o YouTube passou a exigir PoToken e o `timedtext` devolve vazio):
  1. **yt-dlp** (legendas manuais/automáticas) — grátis, sem chave, método padrão.
     Usado no `inspect`. Invocado por `python -m yt_dlp` (configurável via `YTDLP_CMD`).
  2. **Whisper/OpenAI** (transcrição do ÁUDIO) — reserva para vídeos SEM legenda.
     Endpoint próprio `src/app/api/ingest/youtube/transcribe` (baixa áudio com yt-dlp,
     normaliza+fatia com ffmpeg em blocos de 15 min, transcreve cada um e junta).
     Só aparece no Studio (botão "Transcrever áudio (Whisper)") quando há `OPENAI_API_KEY`.
  - **Dependências de ambiente:** `yt-dlp` (instalado via `pip install -U yt-dlp`)
    e `ffmpeg` no PATH. ⚠️ Em deploy serverless (ex.: Vercel) esses binários não
    existem por padrão — rever antes de hospedar (hoje roda local).
- Conversão texto→Portable Text em `src/lib/portableText.ts` (blocos: parágrafos,
  ##/###, >, listas; sem marcas inline na v1).
- Página pública nova: `/videos` e `/videos/[slug]` (embed + resumo + transcrição),
  com queries `videosListQuery`/`videoBySlugQuery`, nav, sitemap e busca atualizados.

**Variáveis de ambiente (`.env.local`):** `ANTHROPIC_API_KEY` (obrigatória, geração),
`OPENAI_API_KEY` (opcional, ativa a transcrição por áudio/Whisper),
`ANTHROPIC_MODEL` / `OPENAI_TRANSCRIBE_MODEL` / `OPENAI_TRANSCRIBE_LANG` / `YTDLP_CMD`
(opcionais), `INGEST_API_SECRET`/`NEXT_PUBLIC_INGEST_API_SECRET` (opcionais — guarda
fraca do endpoint de IA; ver `.env.example`). As chaves Anthropic e OpenAI já estão
configuradas no `.env.local` local (não versionado).

**⚠️ OneDrive trava `node_modules`/`.next`** (erros `EBUSY` em `npm install`/`build`).
Workaround usado: parar o dev server e `rm -rf .next` antes de buildar. Ideal:
excluir a pasta do projeto da sincronização do OneDrive (ou movê-la para fora).

## Comandos úteis
- `npm run dev` — sobe o Next (site + `/studio`).
- `npm run build` / `npm run start` — build e produção.
- `npm run lint` — eslint.

## Convenções / avisos
- **Next.js 16 tem breaking changes** vs. versões anteriores — consultar
  `node_modules/next/dist/docs/` antes de escrever código (ver `AGENTS.md`).
- Conteúdo do `seed.mjs` é **exemplo**: a Andrea edita/substitui tudo pelo Studio.
- `.env*` está no `.gitignore` — nunca commitar tokens.
