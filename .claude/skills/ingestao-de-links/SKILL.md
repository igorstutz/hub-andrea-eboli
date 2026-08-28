---
name: ingestao-de-links
description: Como funciona a ferramenta "Importar de link" do Studio (YouTube, Forbes, LinkedIn) que gera rascunhos trilíngues com IA — matriz fonte × tipo, arquitetura das rotas, transcrição com yt-dlp/Whisper, painel "Agentes de IA" e variáveis de ambiente. Use ao mexer em src/lib/ai, src/lib/ingest, src/lib/transcribe, src/app/api/ingest ou na IngestTool do Sanity.
---

# Ingestão de LINKS → conteúdo (IA)

> ⚠️ Reestruturada em 06/08/2026: era só YouTube, agora são **3 fontes**, e
> **cada fonte gera os seus tipos** (a sessão de 06/08 está em
> `.claude/HISTORICO.md`).

Ferramenta no Studio (**"Importar de link"**, ícone de corrente) que, a partir de
uma URL, extrai o material e gera **rascunhos trilíngues** (pt/en/es) via Claude.
Fluxo em 2 etapas: colar link → "Buscar" (preview) → escolher o que gerar →
"Gerar rascunhos".

| Fonte | Material | Gera |
|---|---|---|
| YouTube | transcrição (yt-dlp / Whisper) | vídeo+resumo, perguntas, artigo |
| Forbes | texto da página (extração automática funciona) | perguntas, artigo |
| LinkedIn | texto **colado à mão** (LinkedIn bloqueia robô — HTTP 999) | perguntas, artigo |

**Conceitos NÃO são gerados por link** em nenhuma fonte — entram à mão no Studio.
A matriz fonte × tipo mora em `src/lib/ingest/sources.ts` (usada pela ferramenta e
conferida de novo no servidor).

**Arquitetura / decisões:**
- Gravação dos rascunhos é feita **client-side pela sessão autenticada do Studio**
  (`useClient().createOrReplace`), com `_id` `drafts.*`. **NÃO** usa
  `SANITY_WRITE_TOKEN` (resolve de vez o problema histórico do token sem permissão).
- Backend: `src/app/api/ingest/youtube/inspect` (metadados + transcrição),
  `src/app/api/ingest/web/inspect` (Forbes/LinkedIn — `src/lib/webArticle.ts`,
  extração à mão, sem dependência nova) e `src/app/api/ingest/generate` (comum às
  3 fontes; chama o Claude e devolve documentos prontos do Sanity).
- Modelo: `claude-opus-4-8` (configurável via `ANTHROPIC_MODEL` **ou pelo painel**),
  saída estruturada (JSON Schema) + streaming. SDK: `@anthropic-ai/sdk`.
- **Agentes de IA configuráveis pelo painel** (singleton `aiSettings`, item
  "⚙️ Agentes de IA" no Studio): voz/persona geral + instruções por tipo
  (vídeo/FAQ/artigo — as de conceito saíram) + modelo + esforço + quantidade
  padrão de perguntas. O endpoint
  `generate` lê esse singleton (cliente sem CDN, `cache: no-store`) e compõe o prompt;
  campos vazios caem em padrões embutidos (`DEFAULT_VOICE`/`STRUCTURAL_RULES`/
  `DEFAULT_INSTRUCTIONS` em `src/lib/ai/generate.ts`). As regras técnicas (3 idiomas,
  JSON, não inventar) são FIXAS e não editáveis. Vale após **Publicar** no Studio.
- **Direcionamentos pontuais:** campo livre na ferramenta "Importar de link"
  (`directions`) injetado com prioridade alta no prompt só daquela geração.
- **Fonte já publicada (Forbes/LinkedIn):** o prompt exige TEXTO NOVO (mesma tese
  e exemplos, sem reaproveitar frases) para o hub não competir com o original no
  Google — ver `REPUBLISH_RULE` em `src/lib/ai/generate.ts`.
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
