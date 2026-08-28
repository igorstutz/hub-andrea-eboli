# Histórico — Andrea Eboli Hub

> Sessões arquivadas em 27/08/2026. **Não é carregado automaticamente** e
> descreve estados que sessões posteriores já reescreveram — leia só quando
> precisar do porquê de alguma decisão antiga. O estado ATUAL, as armadilhas
> vivas e as pendências estão em `.claude/MEMORIA-PROJETO.md`.
>
> ⚠️ Cuidado: coisas descritas aqui como existentes foram apagadas depois
> (ex.: a rota `/ser-poder`, os componentes `PageHeader`/`DetailHeader`, os
> 5 conceitos antigos). Sempre confira no código antes de agir.

### 🗓️ Sessão 20–21/07/2026 — Redesign alinhado à marca real
Igor trouxe documentos da Andrea (bio reformulada, referências de sites e um print
do feed @souandreaeboli com cores e linguagem). Pedido: reformar o hub para a
identidade real dela, "com máximo de perfeição". **Tudo CONCLUÍDO (`tsc`/`eslint`/
build estático de produção OK — 128 páginas nos 3 idiomas) e PUBLICADO.**

1. **Paleta EXATA da marca** (amostrei os pixels do feed), em `globals.css`:
   vinho `#41181E`, verde `#14312C`, creme `#EFE6DF` (o token `cream` ficou 1 tom
   mais fechado, `#ece2d3`, coadjuvante). **Ouro removido de todo o sistema**
   (eram 50 usos em 14 arquivos) → **verde virou a 2ª cor protagonista**. O token
   `--color-gold` sobrou como alias DEPRECADO do vinho (não é mais renderizado).
2. **Tipografia:** título trocado de Cormorant (leve) para **Fraunces** variável
   (`layout.tsx`) — resolve o "está muito leve, precisa ter mais poder".
3. **Barra (`Header.tsx`)** reescrita como client: bolinha (foto/monograma) + nome
   maior, item ativo sublinhado, **drawer no mobile**. Novo menu: Sobre Ser Poder ·
   Sobre Andrea Eboli · Artigos e Perguntas · Vídeos e Podcast · Na mídia · Livro ·
   Contato.
4. **Banner:** `HomeBanner` (hero — "SER PODER" + perguntas rodando + foto integrada
   estilo Esther Perel; kicker "Percepção · Escolha · Presença"; **sem "reconhecida
   por"**) e `PageBanner` (faixa verde em TODAS as abas, ideia do Simon Sinek). Foto
   via `BannerPhoto` (placeholder "AE" até dropar a real — ver próximos passos).
5. **Rotas novas:** `/ser-poder` (a tese: o que é + 2 perguntas-motor + **ECP como
   eixo** + conceitos-pilar), `/sobre` refeita (bio reformulada, layout Adam Grant),
   `/artigos-e-perguntas` (combinada), `/na-midia` (recebeu o "reconhecida por" +
   credenciais), `/livro`, `/contato`. `/videos` virou "Vídeos e Podcast". Casos
   saiu do menu de topo mas continua existindo (`/casos`).
6. **i18n:** namespaces novos `banner`, `aboutPage`, `serPoderPage`,
   `articlesQuestionsPage`, `mediaPage`, `bookPage`, `contactPage` nos 3 idiomas.
   Bio e textos das páginas ficam nos `messages/*.json` (renderizam no estático,
   **não** dependem do Studio).
7. **Decisões que tomei como especialista (Igor valida):** a ECP deixou de ser
   "mais um conceito" e virou o EIXO; "Ser Poder"/"Academia do Poder" mantidos em
   PT nos 3 idiomas; Footer e sitemap atualizados; NewsletterForm ganhou variante
   `tone="light"`.

Componentes NOVOS: `HomeBanner`, `PageBanner`, `BannerPhoto`. Alterados (de-gold +
recolor): Header, Footer, RotatingQuestions, NewsletterForm, PageHeader,
DetailHeader, EndOrnament, LinkList, Marquee, PortableTextBody, LibrarySearch, home.

---

### 🗓️ Sessão 06/07/2026 — Conceitos-pilar + rename Pesquisas→Artigos
**Tudo CONCLUÍDO e validado (`tsc`/`eslint` OK + testes manuais nas páginas):**
1. **Conceitos reais substituíram os do seed** (script `update-concepts.mjs`, transação
   única): Poder Consciente, Liderança, Posicionamento, Comportamento Humano,
   Estrutura Consciente de Poder (ids `concept-<slug>`). Os 4 antigos (Ser Poder,
   Ter Poder, Soberania, Sobrevivência…) foram apagados e as perguntas repontadas.
   Definições são RASCUNHO meu ("Conteúdo provisório") — Andrea deve revisar; títulos
   traduzidos em en/es (se algum for marca proprietária, reverter no Studio).
2. **"Pesquisas" → "Artigos" em todo o sistema**: rota `/pesquisas` → `/artigos`,
   nav/labels nos 3 idiomas, chave i18n `research` → `articles` (a chave `research`
   ficou LIVRE para a futura seção de Pesquisas), sitemap, busca, Studio.
3. **Conceito como pilar central do hub**: página `/conceitos/[slug]` agora lista,
   por busca reversa (GROQ `references(^._id)`), TODAS as perguntas, casos, artigos
   e vídeos ligados ao conceito (+ conceitos nas 2 direções). `caseStudy` e `article`
   ganharam campo `relatedConcepts` no schema; páginas de caso/artigo mostram chips.
   Todos os tipos têm warning no Studio se salvos sem ≥1 conceito. Conteúdo existente
   vinculado via `link-concepts.mjs`.
4. **Agente de IA vincula conceitos automaticamente**: o endpoint `generate` busca os
   conceitos publicados, injeta no prompt e o JSON Schema restringe `relatedConceptIds`
   por enum aos ids reais; docs gerados (pergunta/artigo/vídeo/conceito) saem com
   `relatedConcepts` (refs fracas). Critério editável no painel "⚙️ Agentes de IA"
   (campo novo `conceptLinkingInstructions`). Testado ponta a ponta com geração real.

**Sessão 07/07/2026 — pendências resolvidas:**
- **Slugs limpos IMPLEMENTADOS** (decisão do Igor): `generate/route.ts` consulta os
  slugs existentes (`readTakenSlugs`) e só sufixa em colisão (`makeSlugFactory`);
  fallback: se a consulta falhar, sufixa sempre. Slugs dos 2 vídeos publicados
  limpos via `clean-video-slugs.mjs`. Testado ponta a ponta.
- `/sobre` conferida (íntegra, conteúdo de 24/06) e não há mais rascunhos órfãos.

**Sessão 07–08/07/2026 — Redesign das páginas de detalhe (CONCLUÍDO):**
- Igor testou a importação de vídeo real pelo Studio: slugs limpos + conceitos
  vinculados funcionando ("criou tudo certinho").
- **Páginas de detalhe redesenhadas** (artigo, pergunta, conceito e caso), estilo
  editorial: `DetailHeader` (breadcrumb, badge dourado, meta, título 6xl, lead
  serifado com filete dourado, blobs sutis), grid `1fr_300px` com **sidebar fixa**
  (AuthorCard, SideCard, ChipLinks, LinkList, CopyLinkButton, EndOrnament — tudo
  em `src/components/`), capitular `.drop-cap` (globals.css), âncoras nos H2
  (PortableTextBody) e, no artigo, sumário "Neste artigo" + tempo de leitura.
  Novo namespace i18n `articlePage` nos 3 idiomas.

**Sessão 08/07/2026 (cont.) — Home expandida + listagens:**
- **Home com conteúdo real** (page.tsx virou async + `Promise.all` das 5 queries):
  novas seções após "Bibliotecas" — Conceitos (seção escura c/ os 5 pilares),
  Perguntas (6 cards), Casos (até 4), Tese (existente), Vídeos (3 c/ thumbnail
  do YouTube + play), Artigos (3, lista editorial) — cada uma com CTA
  "Explorar a biblioteca" (`home.sectionCta` nos 3 idiomas). Seções só aparecem
  se houver conteúdo.
- **PageHeader** (listagens + busca) unificado com o visual do DetailHeader
  (blobs, título 6xl, lead serifado). Listagem de conceitos virou glossário
  numerado (01, 02…) com seta no hover.

**Sessão 08/07/2026 (cont. 2) — Busca nas bibliotecas + home com mais vida:**
- **Busca instantânea** nas 5 listagens: componente client `LibrarySearch`
  (`src/components/LibrarySearch.tsx`) filtra no navegador enquanto digita —
  sem recarregar, ignora acentos/maiúsculas, exige todas as palavras (título +
  texto + badge). Cards por variante dentro do próprio componente. Chave i18n
  `search.quickPlaceholder`. A `/busca` global continua.
- **Seções da home incrementadas** (pedido: "mais vida, cor, animação"):
  badges com pulse-dot (eco do hero), CTAs em pill que preenchem no hover,
  marcas d'água serifadas gigantes (aspas nos conceitos, "?" nas perguntas),
  numeração dourada (conceitos e artigos), monograma nos casos, badge de
  duração nos vídeos, linhas de gradiente gold→wine no hover dos cards, blobs
  flutuantes por seção.

**Sessão 08/07/2026 (cont. 3) — DEPLOY no GitHub Pages (NO AR):**
- **URL pública: https://igorstutz.github.io/hub-andrea-eboli** (repo
  `igorstutz/hub-andrea-eboli`; o remote origin foi REPONTADO do antigo
  `andrea-eboli-hub` para ele). Deploy via GitHub Actions
  (`.github/workflows/deploy.yml`): push no master + agendamento diário 09h UTC
  + manual (`gh workflow run` ou aba Actions) — necessário REPUBLICAR quando a
  Andrea publicar conteúdo novo (site estático, conteúdo congelado no build).
- Adaptações p/ estático: `STATIC_EXPORT=1` no next.config (output export,
  basePath `/hub-andrea-eboli`, trailingSlash), `localePrefix: "always"`
  (URLs /pt /en /es; raiz = redirect estático gerado no CI),
  `generateStaticParams` nos 5 [slug], busca global client-side
  (`GlobalSearchClient`, CDN do Sanity direto + CORS de igorstutz.github.io
  adicionado), robots/sitemap `force-static`, SITE_URL via
  `NEXT_PUBLIC_SITE_URL`. CI remove `src/app/api`, `src/app/(studio)` e
  `src/proxy.ts` (não existem no estático). Vídeos: seção movida p/ cima na home.
- ⚠️ No site publicado NÃO funcionam: Studio (usar local), importação de
  YouTube (local), newsletter (definir `NEXT_PUBLIC_NEWSLETTER_ENDPOINT`
  quando houver provedor). Home local: vitrine na apresentação p/ Andrea.

**⏭️ PRÓXIMOS PASSOS:**
- Andrea revisar as definições provisórias dos 5 conceitos no Studio.
- Após publicar conteúdo novo no Sanity: rodar o workflow "Deploy (GitHub
  Pages)" (ou esperar o agendado diário) para o site público atualizar.
- Futuro: domínio próprio (andreaeboli.com) → considerar voltar a hospedagem
  com servidor (Vercel) para ISR/API; ou `npx sanity deploy` p/ Studio hospedado.
- Lembrete: cache de leitura do site é ISR de 1h (`src/sanity/lib/fetch.ts`) —
  edições publicadas demoram até 1h em prod; considerar webhook de revalidação.

---

### 🗓️ Sessão 24–25/06/2026 — Transcrição robusta + Agentes de IA configuráveis
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
