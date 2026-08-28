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

## Estado atual / onde paramos

### 🗓️ Sessão 27/08/2026 (MAIS RECENTE) — Fotos da Andrea + e-mail novo
Ela mandou pelo WhatsApp uma pasta com **71 fotos** (`Downloads/andrea imagens`,
com a subpasta `confraria/`) e o e-mail definitivo. Tudo já está no ar.

1. **E-MAIL NOVO: `contato@serpoder.com`** (era o provisório
   `contato@andreaeboli.com`). Trocado nos 3 `messages/*.json` →
   `contactPage.email`. ⚠️ **O domínio do SITE continua `andreaeboli.com`** —
   decisão do Igor. Ou seja: `metadataBase` (`layout.tsx`) e o fallback de
   `src/lib/seo.ts` **não** foram tocados. Se um dia o site virar `serpoder.com`,
   são esses dois lugares.

2. **`/confraria` ganhou as 3 fotos.** Arquivos em `public/confraria/`
   (`confraria-conversa.webp` = principal, `confraria-grupo.webp`,
   `confraria-encontro.webp`); originais em `../brand-originais/confraria/`.
   A constante `PHOTOS` mudou de `{src, alt}` para **`{src, altKey}`** e o alt
   passou a vir do i18n (`confrariaPage.photoConversaAlt` / `photoGrupoAlt` /
   `photoEncontroAlt`, nos 3 idiomas) — antes seria português nos 3.
   ⚠️ **Duas fotos do lote da Confraria têm marca d'água de fotógrafo
   ("GIT Ikeda")** — as melhores retratos, justamente. Ficaram de fora. Se a
   Andrea tiver o direito de uso, dá para usar (são as 2 do fim da pasta).

3. **Galeria do `/sobre`: 40 fotos no Sanity.** Subidas por script
   (`upload-galeria.mjs`, na raiz — guarda a curadoria e os textos). Cada uma
   com **`alt` em pt/en/es** descrevendo o que se VÊ; a **legenda ficou vazia de
   propósito** (quem é quem, qual evento e que ano é ela que sabe).
   Ordem editorial: retrato → palcos (BrasaConnect/NRF/SXSW) → ONU → podcasts →
   sessões → Confraria → comunidade brasileira → encontros. Ela reordena
   arrastando no Studio.
   - **Descartei 12 das 52** do conjunto principal: 2 duplicatas idênticas
     (md5), 6 prints de celular (story, WhatsApp, navegador), 1 colagem,
     1 panorama 960×348 (recorta mal no 3:4), 1 quase-duplicata que caía ao lado
     da irmã na grade, e **1 foto de família de Ano Novo com o que parecem ser
     menores de idade** — essa não entra num site profissional sem consentimento
     explícito.
   - **Não nomeei terceiros em nenhum alt**, mesmo reconhecendo gente conhecida:
     errar um nome no site dela é pior do que um alt genérico. Os nomes entram
     pela legenda, se ela quiser.
   - ⚠️ O `alt` sai do Sanity, então **republicar** depois de qualquer edição
     dela (site estático).

4. **NÃO serve para o hero.** Tudo veio comprimido pelo WhatsApp (máx. 1600px,
   muita coisa em 768×1024). O hero segue com `andrea-hero-2026.jpg`. Para
   trocar, ela precisa mandar o ORIGINAL fora do WhatsApp (Drive/e-mail).
   A bolinha do header segue `AVATAR_SRC = null` — decisão do Igor de manter só
   a assinatura.

**⏭️ CONTINUA FALTANDO:** os números/gráfico/metodologia da Pesquisa ECP
(`STATS`, `CHART_SRC`, `METHOD`, `RESEARCH_URL` em `/pesquisa`); o depoimento e
o link da Confraria (`TESTIMONIAL`, `CONFRARIA_URL`); a capa do YouTube; e o
retrato em alta para o hero.

---

### 🗓️ Sessão 19–20/08/2026 — Reestruturação pedida pela Andrea
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

**⏭️ MATERIAL QUE A ANDREA VAI MANDAR** (parte chegou em 27/08 — ver a sessão
mais recente no topo): já entraram as fotos da galeria e as 3 da Confraria.
**Ainda faltam:** o retrato em alta para o hero (o que veio está comprimido pelo
WhatsApp); a capa do YouTube (+ shorts); os números/gráfico/metodologia da
Pesquisa ECP; o depoimento da Confraria; e os destinos dos botões "Conheça a
pesquisa" e "Conheça a Confraria". A bolinha do header segue `AVATAR_SRC = null`
por decisão do Igor.

**NÃO É TAREFA DE CÓDIGO:** o domínio. O e-mail já existe e o site já usa
`contato@serpoder.com` (desde 27/08). O domínio do site continua
`andreaeboli.com` no `metadataBase` e no `src/lib/seo.ts`.

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

### 🗓️ Sessão 08/08/2026 — Menu hamburguer não abria no celular
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

## Histórico anterior (arquivado)
As sessões de 20–21/07, 06–08/07, 24–25/06 e a do seed do Sanity estão em
`.claude/HISTORICO.md`, que **não** é carregado automaticamente. Descrevem
estados que as sessões acima já reescreveram; ler só para recuperar o porquê de
alguma decisão antiga.

## Funcionalidade: Ingestão de LINKS → conteúdo (IA)
Ferramenta no Studio ("Importar de link") que gera rascunhos trilíngues a partir
de uma URL (YouTube, Forbes, LinkedIn). A referência completa — matriz fonte ×
tipo, arquitetura das rotas, transcrição, painel "Agentes de IA" e variáveis de
ambiente — virou a skill **`ingestao-de-links`**, que carrega sob demanda.
⚠️ `yt-dlp` e `ffmpeg` NÃO existem em deploy serverless (ex.: Vercel): hoje a
ingestão só roda local.

**⚠️ OneDrive trava `node_modules`/`.next`** (erros `EBUSY` em `npm install`/`build`).
Workaround usado: parar o dev server e `rm -rf .next` antes de buildar. Ideal:
excluir a pasta do projeto da sincronização do OneDrive (ou movê-la para fora).

## Convenções / avisos
- **Next.js 16 tem breaking changes** vs. versões anteriores — consultar
  `node_modules/next/dist/docs/` antes de escrever código (ver `AGENTS.md`).
- Conteúdo do `seed.mjs` é **exemplo**: a Andrea edita/substitui tudo pelo Studio.
- `.env*` está no `.gitignore` — nunca commitar tokens.
