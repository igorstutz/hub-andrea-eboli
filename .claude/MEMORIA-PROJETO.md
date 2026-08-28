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

### 🗓️ Sessão 28/08/2026 (parte 3, MAIS RECENTE) — A /pesquisa saiu do placeholder
O Igor mandou os dois arquivos da Pesquisa ECP: o deck
`Pesquisa IGB - (QExpress) (415_2026).pptx` e o
`Analise de Hipoteses vs Pesquisa - ECP.docx` (ambos em `Downloads/`, FORA do
repositório). A página deixou de ser placeholder.

1. **De onde vieram os números.** Extraí o texto localmente (docx e pptx são ZIP
   com XML dentro; `unzip -p` + limpeza das tags), sem mandar nada para serviço
   externo — é material não publicado dela. Os percentuais do gráfico saíram do
   `ppt/charts/chart12.xml` do próprio deck, não digitados à mão.
   **Base: 403 respondentes**, margem de erro ~4,9%, mulheres 59,6%,
   Sudeste 64,3%, idades de 25 a 55.
   ⚠️ O documento de análise registra que o recorte pretendido era **35-55** e
   que **39,7% da amostra tem 25-34**, fora do alvo. Por isso a metodologia no
   site diz "de 25 a 55 anos", que é a amostra realizada.
   ⚠️ **Falta o crédito do instituto.** O arquivo diz "IGB" e "QExpress", mas eu
   não sei qual é o instituto e qual é o painel, então **não creditei ninguém**.
   Errar isso numa página pública é pior do que omitir. Igor precisa confirmar.
2. **O que entrou na página** (todos os textos no i18n, 3 idiomas, em
   `researchPage.*`; a página é trilíngue):
   - **3 números de impacto:** 82,9% (poder externo não traz realização),
     72,2% (alternam entre entrega e busca de pausa) e **1%** (citaram a si
     mesmas como pessoa poderosa).
   - **Seção nova "Os dados, dimensão por dimensão"**, que lê a pesquisa pelas
     3 dimensões da ECP — é o que amarra a pesquisa ao vocabulário do site.
     Cada dimensão traz o par "declaram X, mas vivem Y", que é o achado central
     da análise (ex.: 84,6% leem o contexto, mas 64% se sentem capturados por
     ele).
   - **Gráfico próprio**, gerado por **`gera-grafico-pesquisa.mjs`**: barras da
     P20 em duas famílias (vinho = poder externo, verde = poder interno), um
     arquivo **por idioma** em `public/pesquisa/`, **com marca d'água gravada**
     (o comentário da página sempre pediu isso; CSS por cima é só atrito).
   - Metodologia e alt do gráfico escritos; placeholders e as chaves `soon` e
     `methodologySoon` foram apagados.
3. 🐛 **Bug achado e corrigido de quebra:** a `/videos` publicada mostrava o
   texto cru **"banner.kicker"** no hero, nos 3 idiomas. Era resquício da
   remoção do kicker em 19/08 (o namespace `banner` foi apagado, a chamada em
   `videos/page.tsx` ficou). O build acusava `MISSING_MESSAGE` e ninguém tinha
   olhado. Agora o build sobe **sem nenhum MISSING_MESSAGE**.
   📌 Lição: **ler os erros do `npm run build`**, não só o "Compiled successfully".
4. ⏭️ **O que ainda falta na /pesquisa:** `RESEARCH_URL` (destino do botão
   "Conheça a pesquisa": deck público, PDF ou página) segue `null`, então o
   botão não aparece. E o crédito do instituto (item 1).
   ⏭️ A análise recomenda um **crosstab** (cruzar P25/P26 com P13/P21) para
   fechar H5 e H6, que hoje ficam como plausíveis mas não comprovadas.

---

### 🗓️ Sessão 28/08/2026 (parte 2) — Casos fora da home + 4 fotos a mais
1. **"Casos e Personagens" saiu da home INTEIRA** (pedido do Igor): a seção de
   casos **e** o cartão no bloco "As bibliotecas do hub". Não apaguei nada — quem
   manda é a flag `SHOW_CASES` no topo de `src/app/(site)/[locale]/page.tsx`,
   que governa os dois lugares. A rota `/casos`, os documentos no Sanity e o
   sitemap continuam intactos.
   - `LIBRARIES` agora é derivada de `ALL_LIBRARIES` (filtro pela flag) e o
     **número do cartão vem da posição na lista**, para não sair 01, 02, 04.
     A grade fecha em **3 colunas** com 3 cartões e volta a 2 + 2 com os 4
     (`LIBRARIES_GRID`).
   - ⚠️ `home.librariesLead` foi reescrito nos 3 idiomas: prometia "os padrões
     de comportamento", que era a descrição de Casos. **Se `SHOW_CASES` voltar a
     true, devolver esse trecho ao lead.**
   - ⚠️ **O rodapé continua linkando "Casos"** (`src/components/Footer.tsx:10`) —
     e ele é global, aparece em toda página. O Igor pediu só a home; fica aí até
     ele decidir.
2. **A /confraria foi de 12 para 16 fotos.** Reavaliei as 7 que tinham ficado de
   fora olhando uma por uma: 4 voltaram (grupo de pé no salão, selfie de duas
   participantes, dupla no painel de árvores e a 2ª cesta de camisetas).
   O `prepara-fotos-confraria.mjs` foi atualizado (é a memória da curadoria) e a
   ordem do mosaico separa as cenas parecidas — as duas cestas ficaram uma no
   topo da 1ª coluna e outra no fim da 3ª.
   - **Continuam de fora, 3:** o print de story do Instagram e os **2 retratos
     com a marca d'água "GIT Ikeda"**.
   - 🔎 **Descoberta:** esses 2 retratos são da **MESMA sessão** do retrato que
     já está no site (`brand/andrea-eboli-retrato-2026.webp`) — mesmo sofá,
     mesmo quadro da Torre Eiffel, mesma roupa. Então não é questão de direito:
     falta só o **arquivo limpo, sem marca d'água**. Pedir essa sessão inteira
     em alta à Andrea resolve de uma vez a pendência do **retrato do hero**.
   - Os 4 alts novos (`photoGrupoSalaoAlt`, `photoSelfieDuplaAlt`,
     `photoDuplaPainelAlt`, `photoCestaBrindeAlt`) estão nos 3 idiomas.
     **A mulher de tiara das fotos novas NÃO foi nomeada:** o crachá dela diz
     "ANDREA T…" e o look é outro, então pode não ser a Andrea Eboli. Se o Igor
     confirmar, é trocar 2 alts × 3 idiomas.
3. **SEO das imagens — auditoria fechada.** Varri `public/` e todo `alt=` do
   código: nenhum arquivo com nome de WhatsApp/celular sobrou e todo `alt` do
   site tem texto, exceto 3 casos de propósito (as 2 thumbs de vídeo do YouTube,
   que têm o título ao lado, e o avatar do header, que nem renderiza).
   - **A galeria do /sobre não tem o que arrumar:** os 40 assets do Sanity já
     estão como `andrea-eboli-01..41.jpeg` (nada de WhatsApp) e com `alt` nos 3
     idiomas. E **nome de arquivo no Sanity não vale para SEO**: a URL do CDN é
     hash (`…/8b3766a9…-1066x1600.jpg`), o nome não aparece nela. Nome de
     arquivo só conta para o que está em `public/`.
   - Sobrou lixo do template do Next em `public/` (`file.svg`, `globe.svg`,
     `next.svg`, `vercel.svg`, `window.svg`) — nada referencia, dá para apagar.

5. **SEO de metadata refeito** (achado ao revisar o SEO das imagens: os alts
   estavam bons, mas o metadata do site tinha três furos sérios).
   - 🔴 **O canonical apontava sempre para o português.** `alternatesFor(path)`
     usava o `defaultLocale`, então `/en/sobre` declarava `/pt/sobre` como
     canônica — ou seja, dizia ao Google que as versões em inglês e espanhol são
     duplicatas e não devem ser indexadas. Num hub trilíngue isso jogava dois
     terços do site fora. Agora é `alternatesFor(path, locale)` (canonical no
     próprio idioma) + **x-default**.
   - 🔴 **A home não tinha canonical nem hreflang** (era a única página sem
     `generateMetadata`) e servia a descrição em português nos 3 idiomas.
     Ganhou metadata própria e **JSON-LD** (WebSite + Person), com o mesmo
     `@id` (`${SITE_URL}/#person`) que o `/sobre` — as duas páginas passam a
     falar da mesma entidade, o que importa para SEO e para GEO.
   - 🔴 **Não existia Open Graph em lugar nenhum:** todo link compartilhado saía
     sem imagem e sem título. Agora há cartão em todas as páginas
     (`pageMetadata()` em `src/lib/seo.ts`, que as 17 páginas usam) e a imagem
     **`public/brand/og-andrea-eboli.jpg`** (1200x630), gerada por
     **`gera-og-image.mjs`** com material da marca: fundo vinho, assinatura em
     creme e o retrato de 2026.
     ⚠️ **Por que `pageMetadata` monta o `openGraph` inteiro:** o merge de
     metadata do Next é **raso**, então uma página que declara `openGraph`
     substitui o do layout. Declarar só `title` ali apagaria a imagem.
     ⚠️ O kicker gravado na imagem ("PESQUISADORA · CRIADORA DA ECP") está em
     português nos 3 idiomas; o `og:image:alt` e a descrição são traduzidos.
   - **`metadataBase`** era fixo em `andreaeboli.com` enquanto o site publicado
     mora no github.io: virou `new URL(SITE_URL)`. Caminhos "/algo" nos campos
     de metadata são resolvidos **a partir do fim** do metadataBase (é o que a
     doc do Next chama de URL Composition), então o basePath do Pages vem junto
     sem precisar do `asset()`.
   - Também: `title` do site era "Andrea Eboli — Ser Poder", **com travessão**,
     justamente o que a Andrea pediu para tirar. Virou "·". Textos novos no
     namespace **`meta`** (`siteTitle`, `siteDescription`, `ogImageAlt`).
   - Os 5 SVGs do template do Next saíram de `public/`.
6. ✅ **PUBLICADO** em 28/08/2026 (commit `1d1c746`): 156 páginas, deploy
   verde e conferido no ar (canonical por idioma, og:image 200, as 16 fotos da
   Confraria com basePath, Casos fora da home).

4. **Screenshot headless: como pegar UMA seção.** O truque antigo
   (`--window-size` altíssimo) **não serve para a home**: o hero é
   `min-h-screen`, então ele engole a viewport inteira e a captura sai só vinho.
   E navegar para `#ancora` não resolve (o scroll acontece antes do layout
   final). O que funciona é **CDP**: subir o Chrome com
   `--remote-debugging-port`, `Runtime.evaluate` com `scrollIntoView` (é o que
   dispara os `Reveal`, que são IntersectionObserver), esperar ~1,8s, ler o
   `getBoundingClientRect` + `scrollY` e capturar com
   `Page.captureScreenshot { clip, captureBeyondViewport: true }`.
   O Node 24 já tem `WebSocket` e `fetch` globais, então não precisa de
   dependência nenhuma. (Alternativa pobre: `--force-prefers-reduced-motion`
   revela os `Reveal` sem esperar, porque o `globals.css` tem esse fallback.)

---

### 🗓️ Sessão 28/08/2026 (parte 1) — Galeria da Confraria + SEO das imagens
Pedido do Igor: aproveitar as fotos da Confraria que tinham ficado de fora e
arrumar **nome de arquivo e alt de todas as imagens** para SEO.

1. **A `/confraria` passou de 3 para 12 fotos** (viraram 16 na parte 2). O bloco "1 principal + 2
   menores" virou **foto de destaque (3:2, largura inteira) + mosaico** em
   `sm:columns-2 lg:columns-3` com `break-inside-avoid`: cada foto fica na
   proporção em que foi tirada (nada de recorte em gente) e o `width`/`height`
   real vai no `next/image`, o que também evita CLS. Os placeholders "AE" e a
   chave `confrariaPage.soon` foram apagados (viraram código morto).
2. **Script novo `prepara-fotos-confraria.mjs`** (raiz): guarda o original
   renomeado em `../brand-originais/confraria/` e gera o `.webp` (máx. 1600px,
   q82) em `public/confraria/`. Ele é a memória da curadoria.
   - **Descartadas 7 das 19:** as **2 com marca d'água "GIT Ikeda"** (de novo:
     são os melhores retratos dela; só entram se ela tiver o direito de uso),
     1 print de story do Instagram (interface e @ sobrepostos), 2 cenas
     repetidas, 1 segunda foto de cesta de camisetas e 1 de 960×1280 (a menor
     do lote).
   - A Andrea aparece em 4 das 12 (conferi rosto/roupa contra o retrato do
     hero antes de nomeá-la no alt). **Terceiros continuam sem nome.**
3. **SEO das imagens — nomes de arquivo.** Tudo em `public/` passou a ter nome
   descritivo com as palavras-chave da marca:
   `andrea-eboli-confraria-lets-be-roda-de-conversa.webp`,
   `confraria-lets-be-foto-oficial-do-grupo.webp` etc.; e
   `brand/andrea-banner.webp` → **`brand/andrea-eboli-retrato-2026.webp`**
   (o original na pasta irmã acompanhou o nome).
4. **SEO das imagens — alts.** Os 12 alts da Confraria são novos e descrevem a
   cena + o contexto, nos 3 idiomas (`confrariaPage.photo*Alt`). Além disso:
   - `BannerPhoto` virou **async** e lê `common.portraitAlt` (era o alt fixo
     "Andrea Eboli"), então o retrato do hero e do `/sobre` acompanha o idioma.
   - Logo do header ganhou `alt="Andrea Eboli"` (o `aria-label` do link
     continua mandando na leitura de tela, então não duplica).
   - Fallback da galeria do `/sobre` virou `aboutPage.galleryFallbackAlt`.
   - **As thumbs de vídeo seguem com `alt=""` de propósito:** o título está do
     lado no card e a imagem é do YouTube (`i.ytimg.com`) — pôr o título ali só
     duplicaria a leitura sem ganho de indexação.
   - Os alts das 40 fotos da galeria no Sanity foram conferidos e **já estavam
     bons** (nomeiam Andrea Eboli + evento); não mexi.
5. **Validado:** `tsc` e `eslint` limpos, **build estático de produção com as
   156 páginas** (as 12 imagens saem com o basePath certo no HTML) e conferência
   visual por screenshot headless em desktop e celular.
   ⚠️ Para buildar local é preciso repetir o que o workflow faz — mover
   `src/app/api`, `src/app/(studio)` e `src/proxy.ts` para fora e devolver
   depois — e definir as variáveis **pelo PowerShell**: no Git Bash o MSYS
   converte `/hub-andrea-eboli` em `C:/Program Files/Git/...`.

---

### 🗓️ Sessão 27/08/2026 — Fotos da Andrea + e-mail novo
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
   ✅ **RESOLVIDO** (conferido em 28/08/2026): os 5 artigos publicados têm
   `source` preenchido. O script `set-article-sources.mjs` cumpriu o papel.

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
