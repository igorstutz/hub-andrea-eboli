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

### 🗓️ Sessão 19–20/08/2026 (MAIS RECENTE) — Reestruturação pedida pela Andrea
**Origem:** documento no Google Docs ("INPUTS SITE") com os pedidos dela.
Texto bruto salvo em `.claude/inputs-andrea-2026-08.txt`.
Como ler um Docs compartilhado: `curl -sL ".../export?format=txt"` (não use
Git Bash com caminhos `/algo` em env var — o MSYS converte para `C:/...`).

**Decisões tomadas com o Igor (4 perguntas, todas na recomendação):**
1. Menu de 7 itens curtos, sem submenu.
2. Pesquisa e Confraria = **duas páginas separadas**.
3. Biblioteca de conceitos **substituída pelos 9 verbetes novos**.
4. Botão "Envie sua pergunta" → **formulário externo** (Tally/Forms), porque é
   o único caminho que também gera o backlog que ela pediu.

**O que mudou (tudo validado: `tsc`/`eslint` limpos + build estático de
produção OK com 156 páginas + conferência visual por screenshot headless):**

1. **A HOME virou a página central da tese.** `/ser-poder` foi **APAGADA** (a
   Andrea: "ele não precisa ser uma aba, ele é a página central"). A home agora
   é: hero → "O que é Ser Poder?" (`#ser-poder`) → **3 perguntas** (eram 2) →
   a ECP + a frase de fecho → **as 3 dimensões da ECP** → **o vocabulário Ser
   Poder** → vídeos → perguntas → casos → artigos → **bibliotecas (foram para o
   FIM**, pedido dela: "como referência das outras abas") → newsletter.
   - A seção "TESE" solta (blockquote "salto neurológico") foi **removida**:
     não está no vocabulário novo e a home agora explica a tese de verdade.
   - Namespace `serPoderPage` deletado; textos novos em `home.*`.
2. **Kicker "Percepção · Escolha · Presença" REMOVIDO do site inteiro**
   (o namespace `banner` deixou de existir). Ela marcou "PODE TIRAR".
3. **Foto: fim do arco.** `.photo-arch` → `.photo-frame` (retangular, raio 4px)
   em `globals.css`; `BannerPhoto` acompanhou. Vale no hero e no `/sobre`.
4. **Barra:** `Sobre · Artigos e Perguntas · Vídeos · Pesquisa · Confraria ·
   Livro · Contato`. **"Na mídia" saiu** do menu, do rodapé e do sitemap — a
   rota `/na-midia` continua existindo, só não é linkada (reversível).
5. **Rotas novas `/pesquisa` e `/confraria`**, com `EvidenceIntro` compartilhado
   (o texto do par + "A pesquisa revela os padrões. A Confraria coloca o método
   em prática."). Os dados/fotos ainda não existem → cada página tem
   **constantes no topo do arquivo** para preencher (`STATS`, `CHART_SRC`,
   `METHOD`, `RESEARCH_URL` / `PHOTOS`, `TESTIMONIAL`, `CONFRARIA_URL`) e
   placeholders elegantes nas cores da marca enquanto estiverem vazias.
   ⚠️ Sobre "não deixar baixar os slides": **não existe proteção real na web**.
   A marca d'água tem de estar **gravada no arquivo** da imagem; o
   `select-none`/`draggable=false` no código é só atrito.
6. **`/sobre`:** bio nova (3 parágrafos dela), o quadro destacado passou a ter
   as **3 perguntas** numeradas, e "Reconhecimento" virou **"Experiências"**
   (`aboutPage.experiences`; `home.credentials` deixou de existir).
   ⚠️ Corrigido: a lista dizia **ESPM**, o documento dela diz **FGV**.
7. **`/artigos-e-perguntas`:** lead novo + os dois parágrafos de apresentação em
   cada bloco + caixa com o botão **"ENVIE SUA PERGUNTA"**.
   O destino vive em `src/lib/askQuestion.ts`: enquanto
   `ASK_QUESTION_FORM_URL` for `null`, cai no **WhatsApp** com mensagem
   iniciada. ⏭️ Igor precisa criar o formulário e colar a URL lá.
   - "Andrea Responde" NÃO virou seção: ela escreveu o texto com esse nome mas
     anotou "SUBSTITUI POR PERGUNTAS HUMANAS" → o nome é **Perguntas Humanas**
     e o texto dela foi adaptado.
8. **Assinatura do rodapé** trocada para "Pesquisadora e criadora da ECP,
   abordagem pioneira para compreender e desenvolver o poder consciente."
   (`footer.tagline`, usada também no `AuthorCard`).
9. **CONCEITOS: os 5 antigos foram APAGADOS e substituídos por 9**
   (`update-concepts-vocabulario.mjs`, transação única, já rodado):
   - `concept` ganhou os campos **`group`** ("dimension" | "vocabulary") e
     **`order`**; a home separa os dois blocos por esse campo.
   - Dimensões: Identidade · Contexto · Movimento.
     Vocabulário: Ter Poder · Ser Poder · O Pêndulo · O Centro do Pêndulo ·
     A Entrega do Poder · O Sequestro da Identidade pelo Contexto.
   - `shortDefinition` são as **palavras dela**, copiadas do documento.
     **`fullDefinition` ficou VAZIA de propósito** — é conteúdo autoral que só
     ela pode escrever. ⏭️ As 9 páginas de conceito precisam disso no Studio.
   - Os **28 documentos publicados** que apontavam para os conceitos antigos
     foram **repontados um por um** (mapa manual no script, feito pelos
     títulos). Zero documento sem conceito. É leitura editorial minha: ela pode
     ajustar qualquer vínculo pelo Studio.
   - "Ter Poder"/"Ser Poder" ficam em português nos 3 idiomas (termo autoral);
     os outros 4 verbetes e as 3 dimensões foram traduzidos.
10. **Travessões / "cara de IA"** (pedido explícito dela). Duas frentes:
    - Os 3 `messages/*.json` foram **varridos** (nenhum `—` sobrou nos textos
      do site).
    - **A raiz do problema era o prompt da IA:** `src/lib/ai/generate.ts` tinha
      a tese ANTIGA (duas perguntas, léxico "soberania/posicionamento") e usava
      travessão à vontade. O `DEFAULT_VOICE` foi reescrito com a tese nova, as
      3 perguntas, as 3 dimensões e os 6 termos do vocabulário; e o
      `STRUCTURAL_RULES` (bloco FIXO, não editável no painel) ganhou uma regra
      de **PONTUAÇÃO** proibindo travessão e outros vícios de texto de máquina.
    - ⏭️ **PENDENTE:** o conteúdo JÁ GRAVADO no Sanity tem **317 travessões em
      26 documentos** (perguntas 124, artigos 144, vídeos 43, casos 6). Duas
      saídas: (a) passada mecânica trocando `—` por vírgula/ponto/dois-pontos
      (rápido, mas pode sair frase torta), ou (b) regerar o conteúdo com o
      prompt novo. **Decisão do Igor/Andrea.**

**⏭️ MATERIAL QUE A ANDREA VAI MANDAR (WhatsApp/Drive) — nada disso está no ar:**
foto da página central; foto do `/sobre` (ela disse "pode ser esta / formato
diferente" — confirmar se é a mesma do hero); o Drive de imagens para a galeria;
a capa do YouTube (+ shorts); os números/gráfico/metodologia da Pesquisa ECP;
as 3 fotos + depoimento da Confraria; e os destinos dos botões "Conheça a
pesquisa" e "Conheça a Confraria". Falta também a bolinha do header
(`AVATAR_SRC = null`).

**NÃO É TAREFA DE CÓDIGO:** comprar `andreaeboli.com` e criar os e-mails
(`contato@` e `andreaeboli@`). O site já usa `contato@andreaeboli.com`.

**FASE 2 (feature nova, escopo próprio):** o "inverso" que ela pediu — trazer as
perguntas que as pessoas fazem às IAs e gerar uma proposta de resposta para ela
validar, + backlog das perguntas enviadas pelo público. Seria uma ferramenta
nova no Studio (gerar a partir de um tema, sem link de origem).

---

### 📌 RESUMO EXECUTIVO (20–21/07/2026 — redesign de marca + publicado)
**O sistema está PUBLICADO** (homologação): **https://igorstutz.github.io/hub-andrea-eboli**
- Repositório `github.com/igorstutz/hub-andrea-eboli` (branch `master`;
  push = deploy automático via GitHub Actions). Republicar = rodar o workflow
  "Deploy (GitHub Pages)" ou esperar o agendado diário (site estático).
- Edição continua LOCAL: `npm run dev` → Studio em `/studio` (YouTube/IA só local).
- **Grande redesign (20–21/07)** alinhando o hub à **MARCA REAL** da Andrea
  (feed @souandreaeboli), a partir de documentos que ela enviou. Detalhes na
  sessão abaixo.

**⏭️ PRÓXIMOS PASSOS (retomar aqui):**
1. **Fotos/marca — RESOLVIDO em parte (01–06/08):** a foto do banner já entrou
   (`public/brand/andrea-banner.webp`, usada por `BannerPhoto` no hero da home E
   na sidebar do `/sobre`) e a assinatura virou logo real
   (`public/brand/logo-andrea-eboli.webp` + variante creme, ver `Header.tsx`).
   **Falta só** a bolinha do header (`AVATAR_SRC = null` em `Header.tsx`) — sem
   ela o header mostra apenas a assinatura. ⚠️ `public/brand/` e essas mudanças
   estavam ainda NÃO COMMITADAS → o site publicado continua com o placeholder
   "AE"; precisa commit + republicar.
2. **E-mail de contato:** provisório `contato@andreaeboli.com`
   (`messages/*.json` → `contactPage.email`). Trocar pelo real.
3. **Conteúdo real:** Andrea revisar as definições dos 5 conceitos + substituir
   perguntas/casos/artigo do seed pelo Studio. Páginas "Na mídia" e "Livro" têm
   placeholders (a lista de imprensa e o livro entram quando houver material).
4. **Republicação automática:** webhook do Sanity → `workflow_dispatch` (Igor tem
   interesse).
5. **Newsletter:** definir `NEXT_PUBLIC_NEWSLETTER_ENDPOINT` quando houver provedor.
6. **Mais adiante:** domínio próprio (andreaeboli.com); mover o projeto para fora
   do OneDrive (risco EBUSY).

---

### 🗓️ Sessão 08/08/2026 (mais recente) — Menu hamburguer não abria no celular
**Sintoma:** no celular o botão do menu "não funcionava" — a página até travava o
scroll, mas nada aparecia.

**Causa (armadilha de CSS):** o `<header>` tem `backdrop-blur`, e um elemento com
`backdrop-filter` vira **bloco de contenção para descendentes `position: fixed`**.
O drawer era filho do `<header>`, então o `fixed inset-0 top-[var(--header-h)]`
passou a ser relativo à BARRA (80px de altura): topo em 80px, base em 0 →
**altura 0**. Medido no navegador: `drawer_rect {y:80, w:390, h:0}` com
`visibility: visible` e `opacity: 1`.

**Correção:** o drawer saiu de dentro do `<header>` (agora são irmãos, dentro de
um fragmento) — o bloco de contenção volta a ser a viewport. Nada de z-index ou
design mudou. Verificado com Chrome emulando iPhone 12: altura passou de 0 para
764px, o menu aparece, clicar em "Contato" navega para `/pt/contato` e fecha o
drawer destravando o scroll.

> ⚠️ Regra para o futuro: **nada `position: fixed` dentro do `<header>`** (ou de
> qualquer elemento com `backdrop-blur`/`transform`/`filter`). Modal, drawer e
> afins ficam fora dele.

---

### 🗓️ Sessão 07/08/2026 — Imagens de public/ no Pages (basePath)
No site publicado a logo do header e a foto do hero não apareciam (404), embora
os arquivos estivessem lá. **Causa:** o export estático exige
`images.unoptimized` e, nesse modo, o `next/image` devolve o `src` como recebeu —
**sem aplicar o basePath**. O HTML saía com `/brand/x.webp` em vez de
`/hub-andrea-eboli/brand/x.webp`.

- **Regra nova:** todo arquivo de `public/` referenciado no código passa por
  `asset()` (`src/lib/assetPath.ts`), que prefixa `NEXT_PUBLIC_BASE_PATH`.
  A MESMA variável alimenta o `basePath` do `next.config.ts` (uma verdade só) e
  está definida no workflow de deploy. Aplicado no `Header` (logo e avatar) e no
  `BannerPhoto` (foto). Corrigido, publicado e conferido no ar (200 nas duas
  imagens; varredura do HTML não achou mais nenhuma URL local sem o basePath).
- ⚠️ **Armadilha de ambiente:** se `STATIC_EXPORT`/`NEXT_PUBLIC_BASE_PATH`
  vazarem para o processo do `npm run dev` (ex.: rodar o build estático e o dev
  na mesma sessão de terminal), o dev passa a redirecionar `/pt` → `/pt/` e dá
  **404** em tudo. Limpar as variáveis (e apagar `.next`) antes de subir o dev.
- 📌 O Igor já usou a ferramenta nova: há artigo publicado com
  `source: "forbes"` (+ `sourceUrl`) e outro com `source: "youtube"` — o filtro
  do site já mostra a pastilha "Forbes". O pipeline das 3 fontes está em uso real.

---

### 🗓️ Sessão 06/08/2026 — Redes no rodapé + HERO ÚNICO em vinho
Pedidos do Igor (lista de ajustes visuais; item 7 + dois seguintes). Tudo
CONCLUÍDO e validado (`tsc`/`eslint` limpos + páginas conferidas no dev com
screenshot headless do Chrome).

1. **Ícones das redes no rodapé** (item 7). Fonte única em `src/lib/social.ts`
   (`SOCIAL_LINKS`, `INSTAGRAM_URL`, `SOCIAL_SAME_AS`): Instagram, LinkedIn,
   YouTube, Spotify e WhatsApp (`5511971963867`). O link do Spotify foi salvo
   **sem** os parâmetros de rastreio (`si`/`nd`/`dlsi`).
   - `src/components/SocialIcon.tsx` — ícones desenhados em **traço**, na mesma
     linguagem do `LibraryIcon` (grade 24×24, stroke 1.6). Sem dependência nova.
   - `src/components/SocialLinks.tsx` — fileira de pastilhas de 40px que se
     invertem no hover (creme cheio + glifo vinho). Namespace i18n novo `social`
     (`follow`, `label` com `{network}`) nos 3 idiomas.
   - No rodapé o link de texto "@souandreaeboli" foi SUBSTITUÍDO pela fileira
     (o @ ficou no `title` do ícone). `/sobre` agora usa `SOCIAL_SAME_AS` no
     JSON-LD (antes só Instagram).
   - ⚠️ O Igor mandou o LinkedIn duas vezes; a 2ª vaga ficou livre (se quiser
     Facebook/TikTok, é só acrescentar em `social.ts` + um ícone).
2. **HERO ÚNICO em todas as páginas, em VINHO** (pedido: "todos os heros, exceto
   a home, devem seguir o estilo do hero do /sobre, trocando o verde por vinho").
   `PageBanner` virou o hero de TODAS as páginas internas: fundo `bg-wine`,
   malha `gradient-mesh-wine` (a mesma da home), blob `wine-soft/40`, marca
   d'água "Poder", breadcrumb, badge com pulse-dot, título 6xl e lead serifado.
   Ganhou prop `meta` (data/tempo de leitura/duração das páginas de detalhe).
   - **`PageHeader.tsx` e `DetailHeader.tsx` foram APAGADOS** — as 5 listagens
     (artigos, perguntas, conceitos, casos, busca), as 4 páginas de detalhe e o
     cabeçalho inline de `/videos/[slug]` agora usam `PageBanner`. Só a home
     mantém hero próprio (`HomeBanner`).
   - Efeito colateral bom: os heros claros (`bg-bone`) sumiram — o site inteiro
     abre em vinho, como a home.
3. **Foto na "portinha" do `/sobre`** — já estava resolvida pelo mesmo
   `BannerPhoto` do hero da home (verificado no HTML e em screenshot). O que o
   Igor viu com o monograma "AE" era página velha/site publicado (ver item 1
   dos próximos passos: falta commitar `public/brand/`).
4. **`/sobre`: frase de fecho em VINHO** (era verde) e **seção nova "Galeria"**
   no fim da página:
   - Campo novo no Studio: **Sobre Andrea → "Galeria de fotos"** (`gallery` em
     `aboutPage.ts`) — array de imagens com hotspot + `alt` e `caption`
     localizados (`localeString`), editor em grade. As fotos são recortadas em
     3:4 (grid de 2/3 colunas, `urlFor(...).width(900).height(1200).fit("crop")`,
     blur do `lqip` e zoom suave no hover).
   - Query nova `aboutGalleryQuery` (`queries.ts`) — descarta slot sem imagem
     (`gallery[defined(asset)]`); `image.ts` passou a exportar o tipo
     `ImageSource`. **`/sobre` agora lê do Sanity** (antes era 100% i18n) →
     depois que a Andrea subir fotos é preciso **republicar** para aparecerem no
     site estático.
   - Sem fotos, a seção mostra **6 placeholders** nas cores da marca (blocos
     vinho/verde/areia com monograma "AE") + a nota "Galeria em preparação."
     (chaves `aboutPage.galleryLabel/galleryTitle/gallerySoon` nos 3 idiomas).
   - Validado: query rodada de verdade no dataset, `urlFor` conferido com
     hotspot, e o layout COM fotos visto em rota temporária (já removida).
5. **`/artigos-e-perguntas`:**
   - **Títulos clicáveis em VINHO** — mexi no `LibrarySearch` (`QuestionCard` e
     `ArticleRow`), então vale também para as listagens `/perguntas` e
     `/artigos` (é o mesmo componente). Conceitos, casos e vídeos seguem com
     título verde (não foram pedidos).
   - **Toggle "Ver primeiro"** (`src/components/SectionOrderToggle.tsx`, client):
     duas pastilhas [Perguntas Humanas | Artigos] logo abaixo do hero. Os DOIS
     blocos continuam na página — o escolhido vai para o topo (reordenação com
     `key` estável, então a ordem do DOM acompanha a visual e o texto já digitado
     na busca sobrevive). Fundo segue a posição: o de cima creme, o de baixo
     areia. Chave i18n nova `articlesQuestionsPage.orderLabel`.
     ⚠️ **É TEMPORÁRIO** — quando os artigos ganharem página própria, apagar o
     componente + a chave e voltar às duas `<section>` fixas.
     Testado com clique real (CDP): a ordem troca nos dois sentidos.
6. **`/na-midia`: seção "Reconhecida por" REMOVIDA** (a lista de credenciais
   continua na sidebar do `/sobre`). As chaves `mediaPage.recognitionTitle` e
   `recognitionLead` ficaram nos `messages/*.json` sem uso, caso ela volte.
7. **INGESTÃO REESTRUTURADA — 3 fontes, cada uma com seus tipos** (ver a seção
   "Funcionalidade: Ingestão de LINKS" mais abaixo, reescrita):
   - `src/lib/ingest/sources.ts` (novo) = a matriz **fonte × tipo**: YouTube
     (vídeo+perguntas+artigo), Forbes e LinkedIn (perguntas+artigo). **Conceitos
     saíram da IA** — todo o caminho de geração de conceito foi REMOVIDO do
     `generate.ts`, da rota, da ferramenta e do painel (`conceptInstructions` e
     `defaultConceptsCount` deixaram de existir no `aiSettings`).
   - Ferramenta renomeada: `YouTubeIngestTool.tsx` → **`IngestTool.tsx`**, título
     "Importar de link" (ícone `LinkIcon`, `name: "link-ingest"`). Detecta a fonte
     pelo domínio, mostra só os alvos permitidos e, nas fontes de texto, exibe o
     texto extraído num **campo editável** (mínimo 400 caracteres para gerar).
   - Rotas: `api/ingest/youtube/generate` → **`api/ingest/generate`** (comum às 3
     fontes, valida a matriz no servidor); nova `api/ingest/web/inspect` com
     `src/lib/webArticle.ts` (fetch + extração à mão, zero dependência nova).
     No `generate.ts` o campo `transcript` virou **`material`** e o prompt ganhou
     `source`.
   - **Testado de verdade:** Forbes extrai OK (`status: ok`); **LinkedIn bloqueia
     robô (HTTP 999)** → sempre vai depender de colar o texto; geração real
     Forbes→(pergunta+artigo) devolveu doc trilíngue com `source: "forbes"`,
     `sourceUrl`, slug limpo, 3 conceitos-pilar vinculados e o alvo "vídeo"
     descartado pela guarda.
8. **Filtro por fonte na biblioteca de artigos** (pedido: "filtrar como se fossem
   categorias"): campos novos `source` + `sourceUrl` no schema `article`
   (`initialValue: "original"`), `source` na `articlesListQuery`, e o
   `LibrarySearch` ganhou `filters`/`filtersLabel`/`allLabel` + `tag`/`filter` por
   item — pastilhas "Todas · YouTube · Forbes · LinkedIn · Originais" que combinam
   com a busca por texto. Aparece em `/artigos` E no bloco de artigos de
   `/artigos-e-perguntas`; só mostra as fontes que existem, e nada aparece se
   houver só uma. Rótulos em `articleSources.*` (3 idiomas);
   `src/lib/articleSources.ts` normaliza artigo sem fonte como "original".
   ⏭️ **Pendência:** os 3 artigos antigos estão sem `source`. Rodar
   `npx sanity exec set-article-sources.mjs --with-user-token` (script já pronto na
   raiz) ou marcar à mão no Studio — sem isso eles ficam todos em "Originais".

---

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

## Funcionalidade: Ingestão de LINKS → conteúdo (IA)
> ⚠️ Reestruturada em 06/08/2026: era só YouTube, agora são **3 fontes**, e
> **cada fonte gera os seus tipos** (ver a sessão de 06/08 acima).

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
