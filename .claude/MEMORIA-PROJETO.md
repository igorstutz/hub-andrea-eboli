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
- **Painel (Studio):** **https://andreaeboli.com/admin** — é o endereço que a
  Andrea usa. No `npm run dev` é o mesmo caminho: `localhost:3000/admin`.
  Reserva: `https://andreaeboli.sanity.studio` (`npx sanity deploy`).
- ⚠️ **projectId e dataset estão FIXOS em `src/sanity/env.ts`**, não só em
  variável de ambiente. O Vite da Sanity só injeta `SANITY_STUDIO_*`, então
  ler `NEXT_PUBLIC_*` no bundle do painel devolve `undefined` (ver a sessão de
  09/09 abaixo).

## ⏭️ TAREFAS DO IGOR (o que só ele pode fazer)

> Atualizado em 22/09/2026. **O ciclo está fechado:** a Andrea importa pelo
> painel, publica, e o site se republica sozinho em até ~30 min (sessão de
> 22/09). Os itens 1 a 4 abaixo estão concluídos e ficam como registro.
> Sobram os "menores" e uma melhoria opcional: o **webhook do Sanity** para
> a republicação ser imediata em vez de a cada 30 min, que exige um token do
> GitHub que só o Igor pode criar (receita em **`deploy/API-CPANEL.md`**).

1. ✅ **cPanel tem "Setup Node.js App"** (conferido na captura de 21/09). Por
   isso o serviço foi feito para rodar lá: `servidor-ingest/` → `dist-api/`.
2. ✅ **Conta na Supadata criada e chave no `.env.local`** (21/09, com
   `TRANSCRIPT_PROVIDER=supadata` e `SUPADATA_MODE=native`; testada com um
   vídeo real, ver a sessão). Plano grátis de 100 créditos/mês, 1 legenda =
   1 crédito. É a fonte de legenda do servidor **e da máquina dele**: em 21/09
   o `yt-dlp` passou a ser barrado no IP residencial também, mesmo atualizado
   para 2026.08.19. (A opção B, API oficial do YouTube com OAuth, ficou
   descartada: não cobre os podcasts em que ela é convidada.)
   ⏭️ A MESMA chave precisa ir para a variável `SUPADATA_API_KEY` do app no
   cPanel (item 3).
3. ✅ **App criado no cPanel** (21/09, à noite): Node 18.20.8, Production,
   root `public_html/ingest-api`, URL `/api`, startup `app.js`, com as
   variáveis `ANTHROPIC_API_KEY`, `TRANSCRIPT_PROVIDER=supadata`,
   `SUPADATA_API_KEY`, `SUPADATA_MODE=native`. Sem conta de FTP nem secret
   novo: o serviço sobe pela conta do site (ver item 5 da sessão).
4. ✅ **Publicado pelo Claude** (`gh` autenticado com escopo `workflow`):
   commits `c68d865` e `58ead1e`, modos `enviar-api` e `enviar-painel`
   rodados duas vezes (a segunda com o modelo de jobs), health, 401, 403 e
   geração real conferidos no ar.
5. ⭐ **Webhook do Sanity → republicação imediata. VIROU A MAIS ÚTIL.**
   Medido em 23/09: o cron do GitHub, declarado de 30 em 30 min, na prática
   dispara a cada **3 a 6 horas** (a plataforma descarta a maioria dos
   agendamentos). Ou seja, hoje a página dela pode levar horas para entrar no
   ar. O webhook faz o deploy começar no instante da publicação. Exige um
   fine-grained token do GitHub (Actions: read and write, só neste
   repositório) colado num webhook do Sanity — passo a passo em
   `deploy/API-CPANEL.md`.
6. **(menor) Revogar o token do robô `seed-temporario`**, que tem permissão de
   escrita e não é mais usado. É um comando, quando ele quiser.
7. **(menor) Créditos da Supadata:** cada vídeo importado gasta 2 (legenda +
   metadados); o plano grátis dá 100/mês. Se um mês passar disso, o menor
   plano pago é US$ 5/mês. O consumo aparece em dash.supadata.ai.

## Estado atual / onde paramos

### 🗓️ Sessão 25/09/2026 (MAIS RECENTE) — Todas as páginas fixas no painel + aba "Acessos" (origem das visitas)
Três pedidos do Igor.

0. **"O último vídeo não entrou no site".** Não era erro: o vídeo foi publicado
   às 21:00 UTC e o cron tinha rodado às 20:43. Disparei `enviar-arquivos` à
   mão e a página subiu nos 3 idiomas. É a latência do cron (item 5 da lista
   dele: o webhook do Sanity resolve).

1. **Páginas fixas editáveis no painel** ("todo conteúdo dessas páginas deve
   poder ser editado pelo painel sem usar códigos"). Painel → **"Páginas do
   site"** com 9 documentos: Página inicial, Sobre, Pesquisa ECP, Confraria,
   Artigos e Perguntas, Na mídia, Livro, Contato e **Bibliotecas** (nomes e
   descrições de Vídeos/Perguntas/Conceitos/Casos/Artigos, que também aparecem
   nos breadcrumbs das páginas de detalhe).
   - 📌 **Lista única em `src/sanity/pageTextDefs.ts`**: dela saem o schema
     (`schemaTypes/documents/pageTexts.ts`, que substituiu `homePage.ts` e
     `aboutPage.ts`) E a semeadura (`semeia-textos-paginas.mjs`, que
     substituiu `semeia-textos-home.mjs`). Campo novo = uma linha lá. O
     arquivo NÃO pode importar nada: o script o carrega com Node puro (type
     stripping do Node 24).
   - `src/lib/pageText.ts` (`getPageText`) substituiu `homeText.ts`: `tx`,
     `txList`, `num` (percentuais), `url`. Mesma regra de antes: painel vence,
     vazio cai na tradução. Chave aninhada vira camelCase (`questions.name` →
     `questionsName`); a abertura comum de Pesquisa e Confraria mora no
     documento da Pesquisa com prefixo `evidence`.
   - Além de texto: **percentuais dos 4 gráficos** (`<labelKey>Pct`; a
     ESTRUTURA e as cores ficam no código, porque a cor é semântica),
     **fotos da Confraria** (as 10 subiram para o Sanity com os alts),
     **retrato** do topo da home e do Sobre, **capa do livro**, **depoimento**
     e **links** dos botões "Conheça a pesquisa/Confraria" e do formulário
     "Envie sua pergunta" (vazio = WhatsApp).
   - 🐛 **Furo da sessão de 23/09 achado e corrigido:** os campos do "Topo" da
     home (perguntas que giram, título, botões) e as mensagens da newsletter
     existiam no painel mas NÃO chegavam ao site: `HomeBanner`,
     `RotatingQuestions` e `NewsletterForm` ainda liam só a tradução. Agora
     leem do painel (os dois de cliente recebem o texto por prop).
   - 🔧 A semeadura antiga gravava itens das listas longas com
     `_type: "localeString"` (schema: `localeText`); corrigido na hora.
   - 🔴 **`aboutPage` tinha lixo de antes do i18n**: `headline` com um texto
     ANTIGO que nunca apareceu no site (passaria a vencer a tradução), além de
     `bio`, `credentials`, `name`, `seo`. Removidos antes de semear.
     E havia um **rascunho `drafts.aboutPage` de 09/09** cuja única diferença
     era um espaço vazio na galeria (item sem imagem); publicá-lo apagaria os
     textos semeados. Descartado (cópia no scratchpad da sessão).
   - ✅ **Provado:** o texto visível das 26 páginas testadas (13 × pt/en) saiu
     idêntico ao que está no ar; marcador gravado no painel apareceu na home,
     na Pesquisa (inclusive a barra em 11,1%), nas listagens e no breadcrumb
     do vídeo; `sanity schema validate` e `documents validate` sem erro.
   - 📌 **Armadilha nova:** a CDN da Sanity (`useCdn: true`) pode entregar a
     versão velha na primeira leitura logo depois de uma gravação, e o dev
     guarda essa resposta EM MEMÓRIA (apagar `.next/dev` não basta com o
     servidor de pé). Para testar mudança do painel no dev: gravar, esperar ~1
     min, parar o dev, apagar `.next/dev` e subir de novo.

2. **Aba "Acessos" no painel = medição própria da origem das visitas**
   (decisão do Igor: dados na hospedagem, dashboard no painel; "lead" = só
   visitas com origem, por enquanto).
   - Site: `SiteTracker` no layout manda cada página vista por `sendBeacon`
     para `/api/track` (só em andreaeboli.com e localhost). Id de SESSÃO em
     sessionStorage (30 min parado = sessão nova), sem cookie. A origem da
     sessão é a da página de entrada.
   - Serviço (`src/lib/analytics/track.ts`, no mesmo app do cPanel): classifica
     UTM > id de clique de anúncio (gclid, fbclid…) > referrer (buscador,
     rede social, **IA**: chatgpt/perplexity/claude/gemini/copilot) > direto;
     grava JSONL por dia em `~/andrea-analytics/` (fora de public_html);
     resumo e CSV exigem sessão de membro (inclusive `viewer`; o papel agora é
     checado DEPOIS do cache em `auth.ts`, senão um liberaria o outro).
   - Painel: indicadores com comparação ao período anterior, sessões por dia,
     tabelas por origem/meio/campanha/termo/conteúdo/site/página de entrada/
     dispositivo/idioma, últimas sessões, **gerador de link com UTM** e
     planilha CSV. Fundo claro próprio (no tema escuro a tinta sumia).
   - ✅ Testado no pacote do cPanel (`dist-api/app.js`) e no Chrome: 7 origens
     classificadas certo, robô/lixo/sid inválido descartados, fuso de Brasília,
     401 sem sessão. `?naomedir=1` desliga a medição no navegador.
   - Guia: `deploy/API-CPANEL.md` → "Medição de acessos".

### 🗓️ Sessão 23/09/2026 — Os textos da home saíram do código e foram para o painel
O Igor: *"eu queria mudar as perguntas da pagina principal e as 3 do
quadrado... mas nao estou as encontrando no admin"*. Não estavam: viviam nos
`messages/*.json` e só mudavam por commit. Perguntei o caminho e ele escolheu
**levar para o painel**, incluindo os demais textos da home.

1. **Singleton `homePage` ("Página inicial", 1º item do painel)** com os **44
   textos** da home em **7 abas** (topo · para quem é · tese · as 3 perguntas ·
   ECP · seções · newsletter), nos 3 idiomas.
2. 🔴 **TODO CAMPO É OPCIONAL e cai na tradução quando vazio**
   (`src/lib/homeText.ts`: `tx()` e `txList()` no lugar de `t()` e `t.raw()`).
   Três motivos: campo limpo sem querer não abre buraco na home; o site
   continua montável com o dataset fora do ar; e não foi preciso migrar tudo
   de uma vez. **10/10 casos** testados (Sanity vence, vazio/só-espaços/idioma
   ausente/campo inexistente/doc nulo caem na tradução; lista vazia idem; item
   vazio no meio é descartado).
3. 📌 **O nome do campo no Sanity é IGUAL à chave de tradução** (`thesisP1`,
   `q1`, `audienceDenial`…). É isso que faz a ponte ser uma linha em vez de um
   mapa de-para — e por isso a query é `{...}` e não campo a campo: listar
   campo a campo significaria editar a query a cada campo novo, e o sintoma de
   esquecer seria silencioso (o painel salva, o site ignora).
4. ✅ **A duplicação das 3 perguntas acabou.** Estavam em `home.q*` **e**
   `aboutPage.q*` com o mesmo texto: mudar uma não mudava a outra. Agora a
   home e o quadro do /sobre leem o mesmo campo. Provado com um marcador
   gravado no painel: apareceu nas DUAS páginas.
5. **`semeia-textos-home.mjs`** levou o texto atual para o painel (já rodado,
   44 campos). Sem isso ela abriria "Página inicial" e veria 44 campos vazios,
   sem saber o que cada um controla. **Não sobrescreve** campo já preenchido,
   então rodar de novo é seguro (é o que fazer quando um campo novo entrar no
   schema). Tem `--gravar`; sem a flag, só simula.
6. 🔴 **MEDIDO: o cron do GitHub NÃO roda de 30 em 30 min.** O `schedule` está
   declarado como `7,37 * * * *`, mas os 8 disparos reais saíram com **3 a 6
   horas de intervalo** (06:07, 12:01, 16:51, 20:09, 23:14, 01:44, 07:41,
   13:35). O GitHub descarta a maioria dos disparos agendados em repositório
   de pouca atividade — comportamento conhecido da plataforma, não erro nosso.
   ✅ O mecanismo em si está **provado**: os 8 runs deram `success` e o mais
   recente registrou `verificar=success deploy=skipped`, que é o
   comportamento certo quando nada mudou.
   ⏭️ **Consequência prática:** a latência real entre ela publicar e a página
   entrar no ar é de **algumas horas**, não de meia. Quem resolve isso é o
   **webhook do Sanity** (`repository_dispatch`, já aceito pelo workflow), que
   exige um token do GitHub que só o Igor cria — receita em
   `deploy/API-CPANEL.md`. Passou a ser a pendência mais útil da lista dele.
7. 📌 **Armadilha ao testar isto no `npm run dev`:** o `sanityFetch` tem
   `revalidate: 3600`, então uma mudança no painel **não aparece** no dev por
   1 hora, mesmo apagando `.next/cache` e reiniciando. O que destrava é um
   query string novo na URL (`/pt?n=123`), que fura o cache de ROTA; o de
   dados continua valendo. Em produção não existe: cada deploy builda do zero.
   📌 E, pela **terceira vez na semana**, perdi tempo com **falso positivo de
   substring**: `grep 't("audienceDenial")'` casa dentro de
   `txList("audienceDenial")`. Usar limite de palavra ao conferir substituição.

### 🗓️ Sessão 22/09/2026 (MAIS RECENTE) — A Andrea importou pelo painel, e o site passou a se republicar sozinho
A ferramenta foi usada de verdade pela primeira vez: o Igor gerou **1 vídeo +
2 perguntas a partir de um SHORT do YouTube** (`P86aZMQzQcY`, 38 s) pelo
painel em andreaeboli.com/admin, e publicou os três. Depois: "toda vez que a
gente gerar conteúdo novo para o site essas páginas devem entrar
automaticamente e também devem sair com todas as regras de SEO/GEO/AEO que as
demais já possuem".

1. ✅ **A importação real saiu íntegra.** Conferido documento por documento na
   API do Sanity: títulos em pt/en/es, corpo trilíngue (8 e 9 blocos por
   idioma nas perguntas), **3 conceitos-pilar** vinculados em cada um, 6
   pontos-chave por idioma no vídeo, transcrição em pt, SEO preenchido, as 2
   perguntas ligadas ao vídeo e **zero travessões** nos três. O `publishedAt`
   e a duração (38 s) vieram certos pela Supadata. Funciona com Short, não só
   com vídeo longo.
2. 🔴 **O que faltava não era a ferramenta, era o deploy.** O site é
   ESTÁTICO: publicar no painel não põe a página no ar. A URL do vídeo novo
   respondia 404 até eu rodar o `enviar-arquivos` à mão. Era exatamente o
   ponto 4 dos "próximos passos" de 20/07 ("republicação automática: webhook
   do Sanity → workflow_dispatch"), que nunca tinha sido feito.
3. **Republicação automática, sem depender de ninguém** (commit `f0a5d1e`):
   - `schedule` a cada 30 min (cron `7,37 * * * *` — minutos fora da virada
     da hora, que o GitHub atrasa). Um job **`verificar`** (sem checkout, 2
     chamadas HTTP, ~5 s) pergunta ao Sanity `_updatedAt` do documento
     publicado mais recente **+ o total de documentos publicados** (o total
     pega exclusões, que não mexem na data mais recente) e compara com o
     **`content-version.txt`** que o último deploy deixou na raiz do site. Se
     for igual, o job `deploy` nem começa (`needs` + `if`).
   - `repository_dispatch` (tipo `sanity-publish`) para um webhook do Sanity
     disparar na hora. Opcional: exige um token do GitHub que só o Igor pode
     criar — receita completa em `deploy/API-CPANEL.md`.
   - O `concurrency` sem `cancel-in-progress` já faz o debounce: o GitHub
     mantém no máximo 1 run na fila por grupo.
   - ⚠️ **Num run automático `inputs.modo` não existe.** Por isso entrou
     `env.MODO: ${{ inputs.modo || 'enviar-arquivos' }}` e os **21 passos**
     com `if:` passaram de `inputs.modo` para `env.MODO`.
   - 📌 **`curl -sf`, não `curl -s`**, ao ler o carimbo: sem o `-f` um 404
     devolve o HTML inteiro da página de erro (que este site tem caprichada)
     como se fosse a versão. A decisão continuaria certa, mas o log ficaria
     ilegível. Corrigido em `7d56b71`.
4. ✅ **Paridade de SEO/GEO/AEO provada no ar**, comparando as 3 páginas novas
   com um vídeo antigo. As novas têm exatamente os mesmos sinais, porque tudo
   é derivado do tipo do documento, não escrito à mão:
   | Sinal | Páginas novas |
   |---|---|
   | canonical no próprio idioma | ✓ |
   | hreflang pt-BR/en/es + x-default | ✓ |
   | Open Graph (5 campos) + twitter:card | ✓ |
   | JSON-LD | vídeo: VideoObject, Person, WebPage, **SpeakableSpecification**, BreadcrumbList, **FAQPage**; perguntas: FAQPage, BreadcrumbList |
   | `Accept: text/markdown` → 200 `text/markdown` | ✓ (4.041 / 3.078 / 2.775 chars) |
   | sitemap.xml · llms.txt · llms-full.txt | ✓ (55 URLs · 58 links · 335 KB) |
   📌 **Falso positivo meu, de novo:** o verificador não achava hreflang em
   NENHUMA página, nem nas antigas. O Next gera **`hrefLang`** em camelCase e
   eu procurava `hreflang=` minúsculo. (O `gera-artefatos-agentes.mjs` já
   usava `/i` na regex; o `verifica-agentes.mjs` não checa hreflang.) Mesma
   classe de erro do `Vary: Accept-Encoding` em 15/09: **conferir a regex
   antes de acreditar num resultado negativo uniforme**.
5. 🎉 **O BLOQUEIO DO CLAUDEBOT ACABOU.** O `verifica-agentes.mjs` deu
   **19/19** pela primeira vez (era 9/19 em 15/09). Medido de novo à mão:
   `ClaudeBot/1.0`, o User-Agent completo com `+claudebot@anthropic.com` e
   `Claude-User` recebem **HTTP 200** na home, no `llms.txt`, numa página de
   vídeo e numa imagem — antes era **429 do LiteSpeed com corpo vazio** em
   tudo, menos no `/robots.txt`. Não houve mudança nossa: o `.htaccess`
   nunca teve regra de User-Agent. Foi a **nuvemHospedagem** que tirou a
   regra (ticket do Igor ou revisão deles).
   ⚠️ Se um dia voltar, o sintoma é 429 com corpo vazio e o caminho é ticket
   na hospedagem, não código. O `verifica-agentes.mjs` segue rodando com
   `|| true` no deploy justamente por isso.

### 🗓️ Sessão 21/09/2026 (MAIS RECENTE) — A ingestão virou um serviço Node para o cPanel, com autenticação de verdade
O Igor mandou a captura do cPanel: existe **"Setup Node.js App"** (CloudLinux
Node.js Selector). Isso fecha a pergunta 1 de 09/09 e destrava hospedar as
rotas de `/api/ingest` na hospedagem que ele já paga, no MESMO domínio do
painel. Tudo abaixo está feito e testado localmente; o que falta exige as
contas dele (lista no topo do arquivo e em **`deploy/API-CPANEL.md`**).

1. **A lógica das rotas saiu do Next.** `src/lib/ingest/handlers.ts` tem os
   5 handlers em forma neutra `(Request) => Promise<Response>`; as rotas em
   `src/app/api/ingest/*/route.ts` viraram invólucros de uma linha
   (`export const POST = handleGenerate`). Motivo: o mesmo código precisa
   rodar em dois servidores (Next no dev, serviço Node no ar) e nada em
   `handlers.ts` pode importar de `next/*` (o client do Sanity vem de
   `@sanity/client`, registrado como dependência direta). Rota nova:
   `GET /ingest/health` (sem auth, sem segredo: só a PRESENÇA das chaves).
2. **`servidor-ingest/app.ts` + `build-api.mjs` → `dist-api/app.js`** (1,2 MB,
   CommonJS, alvo Node 18, dependências dentro, zero `npm install` no
   servidor). O `http` do Node vira `Request`/`Response`. Aceita o caminho
   **com ou sem o prefixo `/api`**: a doc do Passenger diz que em sub-URI o app
   Node recebe o caminho completo (Express precisa de router), mas não é
   categórica, então o roteador tolera os dois. CORS só para
   `INGEST_ALLOWED_ORIGINS` + `andreaeboli.sanity.studio`. O build confere:
   nenhum `require("next…")`, rotas presentes, **nenhuma assinatura de chave
   no bundle** (Anthropic/OpenAI/Sanity). `tmp/restart.txt` com a data do
   build faz o Passenger reiniciar a cada envio (mecanismo criado pela própria
   Passenger para quem só tem FTP).
3. 🔴 **Autenticação de verdade, sem segredo no navegador.** O
   `INGEST_API_SECRET`/`NEXT_PUBLIC_INGEST_API_SECRET` **morreu** (era um
   segredo escrito no bundle). Agora a ferramenta manda o token de sessão do
   próprio Studio (`client.config().token`; no login `dual` padrão a Sanity
   guarda o token em `localStorage.__studio_auth_token_<projectId>` depois do
   login, conferido no código do pacote `sanity`) e o serviço pergunta a
   `https://52ssivbg.api.sanity.io/v2024-10-01/users/me` quem é
   (`src/lib/ingest/auth.ts`). **Medido:** token válido → 200 com `role`
   DO PROJETO; inválido → 401; **sem token → 200 com `{}`**, por isso `id` é
   obrigatório; o host genérico `api.sanity.io` não traz o papel. `viewer`
   recebe 403 (não grava rascunho, gastaria crédito à toa). Cache de 5 min.
4. **Painel:** `IngestTool.tsx` usa `API_BASE = SANITY_STUDIO_INGEST_API_URL
   || "/api"`, manda o `Authorization`, sonda o `/ingest/health` ao abrir
   (mostra na tela se o serviço está fora ou sem chave da Anthropic; botão
   "Buscar" desabilitado até responder) e traduz 401/403/503 em mensagens
   claras. 🐛 De quebra: o link "abrir rascunho" apontava para
   `/studio/intent/…`, caminho que não existe desde 09/09 — agora usa o
   `basePath` do workspace (`useWorkspace()`).
   `sanity.config.ts`: a regra de visibilidade virou `temServicoDeIngestao()`
   = localhost OU bundle buildado com `SANITY_STUDIO_INGEST_API_URL`. O
   `build-painel.mjs` grava `/api` nessa variável e **falha se "Importar de
   link" não estiver em nenhum bundle**. O Studio de reserva continua sem a
   ferramenta (nasce sem, lado seguro).
5. **Workflow:** modo novo **`enviar-api`** (empacota, sobe `dist-api/` por
   FTPS para **`public_html/ingest-api/`** com a conta do site, `state-name`
   próprio, exclui `node_modules/**` e `.npmrc` que o cPanel cria; confere
   `/api/ingest/health` com 6 tentativas e o 401 sem sessão).
   📌 **Por que o app mora DENTRO de public_html** (decidido quando o Igor
   perguntou "tudo isso precisa ser eu mesmo?"): a primeira versão pedia uma
   conta de FTP nova escopada fora de public_html + 2 secrets no GitHub, só
   para o app ficar fora do document root. Como o bundle não tem segredo
   (o build confere) e o `dist-api/.htaccess` nega acesso HTTP à pasta
   (`Require all denied`; o Passenger lê pelo disco), a proteção extra não
   valia dois passos manuais a mais para ele.
   🔴 **`api/**` e `ingest-api/**` entraram na lista `exclude` do envio do
   site**: em `public_html/api/.htaccess` o cPanel grava o bloco "CLOUDLINUX
   PASSENGER CONFIGURATION" que liga a URL ao app, e em `ingest-api/` mora o
   app; apagar qualquer dos dois derruba o serviço.
6. **Transcrição com provedor por ambiente** (`TRANSCRIPT_PROVIDER`):
   `ytdlp` (padrão, local) ou **`supadata`** (servidor). Pesquisa feita em
   21/09 direto na doc/preços (supadata.ai/pricing, docs.supadata.ai): plano
   grátis **100 créditos/mês sem cartão**, pago a partir de **US$ 5/mês**,
   **1 legenda existente = 1 crédito**; endpoint
   `GET api.supadata.ai/v1/transcript?url&lang=pt&text=true&mode=native`
   com header `x-api-key`; 206 = sem legenda (cobra 1). ⚠️ `mode=native` de
   propósito: `auto` transcreve por IA a **2 créditos por MINUTO** (um podcast
   de 60 min = 120 créditos, mais que o mês grátis). ✅ **Testado de verdade
   no mesmo dia**, depois que o Igor criou a conta e mandou a chave (está no
   `.env.local`, com `TRANSCRIPT_PROVIDER=supadata` e `SUPADATA_MODE=native`):
   o vídeo `ytAoYc-UBWQ` voltou pelo serviço empacotado com
   `transcriptAvailable: true`, `transcriptLang: "pt"`, **47.128 caracteres**
   em 16,5 s, e `audioTranscriptionEnabled: false` (o Whisper sumiu, como
   devia). Whisper agora só existe onde o provedor é `ytdlp`
   (`whisperAvailable()`), e `handleTranscribe` devolve 501 fora daí.
   ⚠️ No mesmo teste, `description`, `durationSeconds`, `publishDate` e
   `chapters` vieram vazios: a leitura da página `watch` do YouTube
   (`ytInitialPlayerResponse`) também está sendo barrada neste IP, e em
   datacenter vai ser sempre. Ver o item 11.
7. 🔴 **DESCOBERTA: o `yt-dlp` passou a ser barrado NA MÁQUINA DO IGOR
   também.** A prova de inspeção real (`ytAoYc-UBWQ`) voltou 200 com título
   e autora mas `transcriptAvailable: false`; direto no yt-dlp:
   `Sign in to confirm you're not a bot`. Atualizei o yt-dlp de 2026.06.09
   para **2026.08.19** e a barreira continuou. Ou seja: a premissa de 09/09
   ("funciona em IP residencial") caiu, e o Whisper local (que baixa o áudio
   com yt-dlp) caiu junto. Consequência: a Supadata passa a ser a fonte de
   legenda também no dev. Alternativa local, se um dia quiser: yt-dlp com
   `--cookies-from-browser`, que usa a sessão do YouTube dele no Chrome —
   não fiz sem perguntar.
8. **Validado:** `tsc` e `eslint` limpos; `node build-api.mjs` OK; serviço
   subido em `localhost:8787` e **15 provas** (health com/sem `/api` e com
   barra final; 404; 401 sem token e com token inválido; 400 `invalid_url` e
   `no_valid_target` COM sessão, provando que a auth passou sem gastar IA;
   401 nas 3 rotas de trabalho; preflight CORS 204/403; `Cache-Control:
   no-store`): 14 passaram e a 15ª foi a que revelou o item 7. O token de
   teste veio de `~/.config/sanity/config.json` (CLI) e nunca foi impresso.
   `node build-painel.mjs` rodado: **30 bundles, base path `/admin`, serviço
   em `/api`, e a conferência achou "Importar de link" no bundle** — o painel
   publicado vai mostrar a ferramenta assim que o modo `enviar-painel` rodar.
   📌 Armadilha: o `tsc` acusava `Type 'Route' does not satisfy…` por tipos
   velhos em `.next/dev/types`; `rm -rf .next` inteiro falhou (OneDrive), mas
   apagar só `.next/dev/types` bastou.
   📌 Armadilha 2: um heredoc `python - <<'PY'` com o script inteiro dentro
   quebrou o parser do Git Bash ("unexpected EOF while looking for matching
   `''`") sem rodar nada. Script em arquivo no scratchpad + `python arquivo.py`
   resolve.
9. **O que NÃO deu para verificar sem o cPanel** (listado em
   `deploy/API-CPANEL.md`): versões de Node oferecidas (o bundle pede ≥ 18);
   se o `/api` chega ao app (tolerado); **timeout do LiteSpeed/Passenger** —
   uma geração leva 1 a 3 min; se a primeira geração real cair em 504 perto
   de 60 s, a saída é transformar a geração em job assíncrono; e se o
   `tmp/restart.txt` vale no LiteSpeed (a doc do LiteSpeed diz que apps do
   CloudLinux Node.js Selector funcionam "out of the box"; o botão Restart do
   cPanel é o plano B).
10. ⚠️ Os dois agentes de pesquisa lançados no início caíram por **limite de
    gastos mensal da conta** antes de devolver algo; a pesquisa foi refeita
    à mão com `curl` nas docs (mais barato). Não há commit desta sessão.
11. **Metadados do vídeo pela Supadata, como reserva.** Quando a página
    `watch` não responde (`ytInitialPlayerResponse` ausente), `youtube.ts`
    chama `fetchYouTubeMetadataRemote` (em `transcribe.ts`):
    `GET api.supadata.ai/v1/metadata?url=…` → `title`, `description`,
    `author.displayName`, `media.duration`, `createdAt`. **1 crédito a mais
    por vídeo** (total 2), só nesse caso. Nunca lança: metadado é acessório.
    ✅ Testado: o mesmo vídeo passou a voltar `durationSeconds: 2806`,
    `publishDate: 2025-11-17…` e descrição de 1.643 caracteres (antes,
    vazios). Os endpoints `/youtube/transcript` e `/youtube/video` da Supadata
    estão marcados `deprecated` na OpenAPI deles; o código usa os universais
    `/transcript` e `/metadata`.
12. ✅ **PUBLICADO em 21/09/2026** (commit `c68d865`): o Igor criou o app no
    cPanel (Node **18.20.8**, Production, raiz `public_html/ingest-api`, URL
    `/api`, `app.js`) e eu rodei `enviar-api` e `enviar-painel` pelo `gh`.
    Conferido no ar: `/api/ingest/health` 200 com `anthropic:true` e
    `provider:"supadata"`; `POST /api/ingest/generate` sem sessão → 401;
    `/ingest-api/app.js`, `/ingest-api/` e o arquivo de estado → **403** (o
    `.htaccess` da pasta vale no LiteSpeed); inspeção autenticada do vídeo
    real respondida pelo servidor em 12 s com legenda, duração e data (o
    prefixo `/api` chega ao app e o roteador o remove); painel republicado com
    28 bundles e `/admin/`, `/admin/structure` em 200.
    📌 Antes do envio, `public_html/ingest-api/app.js` (o placeholder "It
    works!" do cPanel) respondia **200 por HTTP** — a pasta nasce aberta; é o
    nosso `.htaccess` que a fecha.
13. 🔴 **O TIMEOUT PREVISTO ACONTECEU, e a geração virou um JOB.** Geração
    real contra o serviço publicado (vídeo + 3 perguntas, transcrição de 47 mil
    caracteres): `HTTP 500` do **LiteSpeed** aos **121 s**, corpo HTML
    "Request Timeout … increase 'Connection Timeout'". É limite do servidor
    web, fora do alcance do `.htaccess`. Correção:
    - `src/lib/ingest/jobs.ts`: jobs em disco (um JSON por job em
      `os.tmpdir()/andrea-ingest-jobs`, gravação atômica por rename), com
      `ownerId` (id do usuário no projeto) e detecção de job morto (running há
      mais de 15 min → failed). Em disco e não em Map porque o Passenger pode
      ter mais de um processo e a consulta cair em outro.
    - `POST /ingest/generate` valida tudo e responde **202 `{jobId}`** na
      hora; `runGeneration` segue em segundo plano no processo Node.
      `GET /ingest/generate/<jobId>` (rota nova nos dois servidores; no Next é
      `generate/[jobId]/route.ts`) devolve `running | completed {documents} |
      failed {message}`; só o dono do job lê (senão 404).
    - `IngestTool` consulta a cada 3 s, mostra o tempo decorrido e desiste
      aos 15 min. Continua aceitando um 200 direto com `documents`.
    ⚠️ O `inspect` (7 a 16 s) e o `web/inspect` ficam síncronos: cabem no
    limite. O Whisper (`transcribe`) é só dev.
    ✅ **Publicado (commit `58ead1e`) e provado no ar:** geração real do
    mesmo vídeo (47 mil caracteres, vídeo + 3 perguntas) pelo serviço
    publicado: `POST` respondeu **202 em 79 ms**, o job terminou em **128 s**
    (42 consultas; teria caído no corte de 120 s do modelo antigo) e voltaram
    **4 documentos** (1 vídeo + 3 perguntas, cada um com 3 conceitos-pilar
    vinculados, slugs limpos; o do vídeo ganhou sufixo porque já existe um
    igual no dataset). Os documentos NÃO foram gravados: a gravação é do
    Studio. **A ferramenta está pronta para a Andrea usar em
    andreaeboli.com/admin → "Importar de link".**

---

### 🗓️ Sessão 15/09/2026 — O site ficou legível para agentes de IA (e o build voltou a funcionar)
O Igor trouxe uma auditoria de "agent readiness" (54/100) e pediu para conferir.
Conferi item por item batendo no site no ar: a auditoria está certa no
essencial, e num ponto é generosa demais.

1. 🔴 **BUILD QUEBRADO — achado por acaso, e era urgente.** Ao buildar local
   para testar, o export morreu em
   `TypeError: Cannot read properties of null (reading 'answer')` na página
   `/pt/videos/vulnerabilidade-e-fraqueza-.../`. Causa: `relatedQuestions[]->`
   devolve **null DENTRO do array** quando o documento apontado não existe
   mais, e alguém apagou/despublicou uma pergunta no Studio. 4 das 5
   referências daquele vídeo estavam perfeitas; a 5ª derrubava o site inteiro.
   ⚠️ **Não é erro de página, é erro de PRERENDER**: o `npm run build` falha e
   o site para de poder ser republicado. Com a Andrea publicando sozinha desde
   09/09, isso ia acontecer de novo.
   **Correção:** as 8 referências de array em `queries.ts` passaram de `[]->`
   para **`[defined(@->)]->`** (validado contra o dataset: 1 null a menos), e o
   filtro do vídeo virou `q?.answer`. Há uma nota no topo de `queries.ts`.
   📌 **Regra:** em GROQ, array de referência é SEMPRE `[defined(@->)]->`.

2. ✅ **O bloqueio de bot é real, e é da HOSPEDAGEM, não do código.** Medido:
   User-Agent contendo `claudebot` (sem distinção de maiúsculas) recebe
   **HTTP 429, corpo vazio, do LiteSpeed**. GPTBot, ChatGPT-User,
   Google-Extended, PerplexityBot e Bytespider recebem 200.
   🔎 O detalhe que entrega o desenho da regra: para o ClaudeBot o
   `/robots.txt` responde **200** e todo o resto (inclusive imagens) responde
   **429** — é "deixa ler o robots, nega o conteúdo".
   ⚠️ Nosso `.htaccess` não tem nenhuma regra de User-Agent. **Só resolve com
   ticket na nuvemHospedagem** — o texto pronto está no histórico da conversa
   e a tarefa está na lista do Igor no topo deste arquivo.
   ✅ **RESOLVIDO em 22/09/2026:** o ClaudeBot passou a receber 200 em tudo e
   o `verifica-agentes.mjs` foi de 9/19 para **19/19**. Ver a sessão de 22/09
   no topo.

3. **`gera-artefatos-agentes.mjs` (novo)** — roda depois do `npm run build`,
   sobre o `out/`, e produz:
   - **`index.md` ao lado de cada `index.html`** (153 páginas, 51 por idioma):
     o `<main>` convertido com **turndown** (a única dependência nova, de
     build). Sai sem menu, rodapé, script, `nav` e sem qualquer elemento
     `aria-hidden` — que é o próprio site declarando "isto não é conteúdo"
     (era de lá que vinha a marca d'água "Poder" no topo de todo markdown).
     Links viram absolutos e ganham separador quando estão colados no HTML.
   - **`llms.txt`** (formato llmstxt.org, 53 links) com a seção **"Quando usar
     este site"** escrita à mão: os termos autorais (ECP, Ter Poder/Ser Poder,
     o Pêndulo) e — igualmente importante — **quando NÃO citar** o site. Sem
     percentuais de propósito: o número muda conforme o recorte da pergunta.
   - **`llms-full.txt`** (324 KB, o corpus em português).
   - **`404.html` da marca**, nos 3 idiomas. A que estava no ar era a de
     fábrica do Next, **em inglês** ("404: This page could not be found.").
     Traz links para gente e um bloco markdown com sitemap e llms.txt.
     📌 Escrita à mão porque o projeto tem DOIS layouts raiz em grupos de rota
     (`(site)/[locale]` e `(studio)`) e um `not-found.tsx` no topo do `app/`
     não teria layout raiz.
   🔴 **Por que parte do HTML buildado e não do Sanity:** são 156 páginas de 17
   modelos. Gerar da fonte exigiria manter duas versões em sincronia para
   sempre; lendo o `<main>` pronto, o markdown é por construção a mesma página.

4. **`deploy/htaccess`: negociação de markdown** (acceptmarkdown.com), com os
   4 critérios: serve `.md` para `Accept: text/markdown`, `Vary: Accept`,
   **406** para tipo que a rota não produz, e q-values na prática.
   ⚠️ O padrão casa **só** com `/pt/`, `/en/` e `/es/` — solto pegaria
   `/admin/` e o painel passaria a receber markdown nas próprias requisições.
   ⚠️ `Header append Vary` e não `merge`: `merge` é mais recente no mod_headers
   e não vale arriscar o .htaccess inteiro em 500.

5. **`robots.ts`**: os 15 agentes de IA agora são nomeados explicitamente (o
   `*` já bastava; a lista é declaração de intenção num hub de GEO) e o
   `Disallow` velho de `/studio` virou `/admin`.

6. **`verifica-agentes.mjs` (novo)** — o "teste" deste projeto: prova os 19
   critérios contra o site NO AR e sai com erro se algum essencial falhar.
   Metade das regras mora no `.htaccess` e na hospedagem, então teste unitário
   passaria verde com o site fora do ar.
   📌 Rodado ANTES do deploy como baseline: **9/19**. Ele achou dois falsos
   positivos meus, já corrigidos: `Vary: Accept-Encoding` contém a palavra
   "accept" e passava como se fosse `Vary: Accept`.
   No workflow ele roda no modo `ativar` com `|| true` — **de propósito**: o
   bloqueio do ClaudeBot é da hospedagem e pintaria de vermelho todo deploy.

7. 📌 **Armadilha de ambiente (custou dois builds):** `Remove-Item .next` com
   `-ErrorAction SilentlyContinue` **falha calada** quando o OneDrive está
   segurando a pasta, e o build seguinte type-checa tipos velhos e morre em
   `Type 'Route' does not satisfy the constraint '/[locale]'`. Sempre conferir
   com `Test-Path .next` depois de apagar. E mover as partes server-only para
   **fora** do projeto (o scratchpad), não para uma pasta interna: o tsconfig
   varre a raiz e passa a type-checar o que devia estar escondido.

---

### 🗓️ Sessão 09/09/2026 — O painel saiu de um domínio de terceiro e veio para andreaeboli.com/admin
O Igor: "não consigo acessar o painel. Não vejo sentido acessar isso por uma
outra url. Queria algo como https://andreaeboli.com/pt/admin".

1. 🔴 **O "não consigo acessar" NÃO era login — era um bug de build que
   derrubava o painel na inicialização.** `src/sanity/env.ts` lia
   `process.env.NEXT_PUBLIC_SANITY_DATASET` com um `assertValue` em volta. Isso
   funciona no build do Next, mas o `sanity build`/`sanity deploy` empacotam com
   **Vite**, que só injeta variáveis com prefixo `SANITY_STUDIO_` e troca a
   expressão `process.env` inteira por `{}`. Medido no bundle que estava em
   `dist/`: `var Ele={}` e logo abaixo `Ele.NEXT_PUBLIC_SANITY_DATASET` — ou
   seja, o painel abria e morria em "Variável de ambiente ausente", **com o
   build passando verde**.
   Correção: `env.ts` agora tem os valores do projeto escritos no arquivo
   (`52ssivbg` / `production`), com a variável de ambiente ainda tendo
   precedência. Não é segredo — projectId e dataset já saem no HTML de toda
   página do site.
   📌 O `build-painel.mjs` **confere isso no fim do build**: se o projectId não
   aparecer em nenhum bundle, ele falha em vez de entregar um painel morto.

2. **O painel agora é servido pela própria hospedagem, em `/admin`.**
   O Studio é uma SPA (um index.html + bundles com hash): não precisa de
   servidor Node e cabe na mesma hospedagem estática do site. Não havia motivo
   para ele morar em `andreaeboli.sanity.studio`.
   - **`build-painel.mjs`** (raiz) é o único jeito certo de buildar.
     🔴 O `sanity build` **NÃO lê o `basePath` do `sanity.config.ts`** (essa
     chave vale só para o Studio embutido no Next): ele resolve por
     `SANITY_STUDIO_BASEPATH` ou por `project.basePath` do `sanity.cli.ts`
     (`determineBasePath`, no @sanity/cli). Sem a variável, o build sai
     apontando para `/static/...` e o painel abre em tela branca.
     ⚠️ E **não** dá para pôr `project.basePath` no `sanity.cli.ts`: aquilo vale
     também para o `sanity deploy`, e quebraria o painel de reserva, que é
     servido na raiz.
   - **`deploy/htaccess`** ganhou a reescrita da SPA (`/admin/qualquer-coisa`
     que não exista como arquivo → `/admin/index.html`), sem a qual **F5 dentro
     do painel dá 404**; o atalho `/(pt|en|es)/admin` → `/admin`; e cache longo
     para `/admin/static/*.js|css`.
   - **Workflow ganhou o modo `enviar-painel`**, com sincronização e arquivo de
     estado PRÓPRIOS (`.deploy-painel-state.json`). É separado de propósito: o
     painel são ~9 MB que só mudam quando o schema muda, enquanto o site é
     republicado a cada texto que ela publica.
     🔴 Por isso **`admin/**` entrou na lista `exclude` do envio do site** —
     sem essa linha, o primeiro republish do site apagaria o painel inteiro.
   - **CORS:** `https://andreaeboli.com` foi liberado no projeto Sanity com
     credenciais (`npx sanity cors add … --credentials`). Sem isso o painel
     carrega e não consegue logar nem ler nada.

3. **`/studio` virou `/admin` também no dev** (`src/app/(studio)/admin/…`,
   `basePath` do `sanity.config.ts`, matcher do `src/proxy.ts`, `robots.ts`).
   Um caminho só, local e publicado.

4. **A ferramenta "Importar de link" agora aparece SÓ no `npm run dev`.** A
   regra era negativa (esconder em `*.sanity.studio`) e o painel em
   andreaeboli.com passaria a exibir um botão que chama `/api/...` inexistente.
   Virou positiva: só em localhost. Um destino novo nasce sem a ferramenta.

5. **Validado:** `tsc` e `eslint` limpos; build do painel com o script
   (30 bundles, base path certo); painel servido em `localhost:3333/admin`
   (origem já liberada no CORS) e **aberto no Chrome headless: a tela de login
   do Sanity renderiza**, sem erro de ambiente; deep link `/admin/structure`
   servido pelo fallback; e no dev `/admin` responde 200 com o Studio.
   📌 `eslint.config.mjs` precisou ignorar `dist-painel/**`: com 9 MB de bundle
   minificado o eslint morre com um stack trace do V8, sem mensagem.

6. ✅ **PUBLICADO em 09/09/2026** (commit `ecf6594`): rodados os modos
   `enviar-painel` e `ativar`, nessa ordem — o `.htaccess` só sobe no
   `ativar`, e sem ele o F5 dentro do painel dá 404. Conferido no ar:
   `/admin/`, `/admin/structure` e `/admin/vision` em 200, `/pt/admin`
   redireciona 301 para `/admin/`, o site segue de pé, e **o painel aberto no
   Chrome headless mostra a tela de login do Sanity** — o erro de ambiente
   acabou. A cópia de segurança do `.htaccess` do WordPress foi preservada
   (863 bytes), como manda a guarda de idempotência do passo.

7. 🔴 **Armadilha do basePath, achada com o painel já no ar: a URL virava
   `/admin/admin` depois do login.** Quem monta o caminho final é
   `joinBasePath(rootPath, config.basePath)`, dentro do pacote `sanity`
   (`node_modules/sanity/lib/index.js`). No painel publicado o `rootPath` já é
   `/admin` (vem do `SANITY_STUDIO_BASEPATH`), então declarar `/admin` também
   no `sanity.config.ts` **soma os dois**. A chave virou condicional: só existe
   quando a variável do build NÃO existe, que é o caso do Studio embutido no
   Next (sem ela o painel cairia na raiz do site). Conferido no bundle
   publicado: `{basePath:void 0,projectId:…}`.
   📌 E, de quebra: `**/admin/admin**` dentro de um comentário `/* */` **fecha
   o comentário** no `*/`. Foi o que quebrou o `tsc` na primeira tentativa.

8. 👤 **Quem entra no painel:** o projeto tem **2 membros** — Igor Fonseca
   (Administrator) e `seed-temporario (Robot)` com papel **Editor**, resquício
   do seed. **A Andrea ainda NÃO é membro**, então o painel só abre com a conta
   do Igor. Cada pessoa entra com a PRÓPRIA conta (Google, GitHub ou
   e-mail+senha); ninguém compartilha login. Convite:
   `npx sanity users invite <email> --role editor` ou pelo
   sanity.io/manage/project/52ssivbg → Members.
   ✅ **09/09: a Andrea foi convidada** (`andreaeboli2018@gmail.com`) como
   **Administrator**. 🔴 Não foi escolha de generosidade: **o plano atual só
   oferece `administrator`, `blueprints-deployer` e `viewer` para pessoas** —
   não existe `editor` para convidar (o "Editor" do robô é papel de TOKEN, não
   de usuário). Como `viewer` não publica nada, administrator é o único papel
   que faz o painel servir para ela. O papel Editor (edita conteúdo sem mexer
   em configuração, membros ou tokens) exige plano pago; se um dia subir o
   plano, é o caso de rebaixar o acesso dela.
   ⏭️ Vale revisar o token do robô `seed-temporario`, que tem permissão de
   escrita e não é mais usado.

9. 🔴 **MEDIDO: o `yt-dlp` NÃO funciona em servidor.** O Igor pediu para
   hospedar as rotas de API para a Andrea gerar conteúdo sozinha. Antes de
   escolher host, rodei os argumentos exatos de `src/lib/transcribe.ts` num
   runner do GitHub (IP Azure = mesmo tipo de IP de Render/Fly/Vercel/cPanel),
   com um vídeo real dela (`ytAoYc-UBWQ`):
   `ERROR: [youtube] Sign in to confirm you're not a bot.`
   **Não é limitação de plano de hospedagem** — é o YouTube barrando IP de
   datacenter. Funciona na máquina do Igor porque ela tem IP residencial.
   Consequência de projeto: hospedar as rotas exige **trocar a fonte da
   transcrição** (serviço de transcrição com proxy residencial, ou a API
   oficial do YouTube com OAuth do canal dela, que só cobre os vídeos DELA);
   o `yt-dlp` fica como caminho local. E, sem `yt-dlp`/`ffmpeg`, some a
   exigência de container — hospedagem com Node simples passa a servir.
   ⚠️ Junto disso: a guarda atual do endpoint é `NEXT_PUBLIC_INGEST_API_SECRET`,
   **visível no bundle do navegador**. Serve em localhost; em endpoint público
   vira "qualquer um gasta os créditos da Anthropic". Trocar por validação do
   token do Sanity de quem chama (perguntar ao Sanity quem é e se é membro).

**⏭️ Pendências pequenas desta rodada:**
- **O `robots.txt` no ar ainda diz `Disallow: /studio`.** O `ativar` só
  republica `.htaccess` e o `index.html` da raiz; o `robots.txt` novo (com
  `/admin`) entra no próximo **`enviar-arquivos`**. Sem urgência: o HTML do
  painel já traz `<meta name="robots" content="noindex">`.
- **O painel de reserva (`andreaeboli.sanity.studio`) continua com o erro de
  ambiente.** Para consertar: `npx sanity deploy`.

---

### 🗓️ Sessão 31/08/2026 — "Para quem é", 4 gráficos, corte de fotos e /na-midia reaberta
Quatro pedidos do Igor numa mensagem só. Tudo feito e validado (`tsc`/`eslint`
limpos, **build estático com as 156 páginas SEM nenhum aviso** e conferência
visual por screenshot em desktop e celular, servindo o `out/` com o basePath).

1. **Home: seção "Para quem é o Ser Poder?"** (`#para-quem`), logo depois do
   banner e ANTES da tese — é o filtro que separa o público dela de quem
   procura autoajuda. Texto é dela, colado inteiro.
   - As quebras de linha dela são o conteúdo (a anáfora "Para quem…" só
     funciona uma linha por vez), então cada linha é um parágrafo. Os textos são
     **arrays** no i18n: `home.audienceDenial` (3), `audienceAffirmation` (4),
     `audiencePivot` (3), `audienceTurn` (2), `audienceClose` (2), lidos com
     `t.raw()`.
   - **Sem marcador de lista, de propósito.** A primeira versão tinha um traço
     antes de cada linha da anáfora e ficou lendo como travessão, exatamente o
     que ela pediu para tirar do site. Quem separa os blocos é o corpo do texto
     e um filete.
   - O TÍTULO foi normalizado para "Para quem é o Ser Poder?" (ela escreveu
     "SER PODER" em caixa alta) para casar com o `thesisTitle` logo abaixo,
     "O que é Ser Poder?". **No corpo a caixa alta dela foi mantida**, porque é
     lá que ela carrega o contraste TER PODER × SER PODER. Em en/es os dois
     termos ficam em português (regra do projeto) com uma glosa curta.

2. **/pesquisa: 1 gráfico virou 4, e eles deixaram de ser imagem.**
   O Igor: "essa estética não bate com a minha". A causa era simples: o `.webp`
   era desenhado em **Georgia + Helvetica**, e o site é **Fraunces + Inter**.
   - Agora os gráficos são **HTML/CSS na página** (`src/components/ResearchCharts.tsx`),
     então herdam a tipografia e a paleta reais, servem os 3 idiomas sem gerar
     3 arquivos e **funcionam no celular sem rolagem horizontal** (rótulo em
     cima, barra em largura cheia embaixo). Sumiram o `min-w-[760px]`, as chaves
     `chartScrollHint` e `chartAlt`, os 3 `.webp` e o `gera-grafico-pesquisa.mjs`.
   - **A procedência dos números migrou para `src/lib/researchData.ts`**, com o
     número do `chartN.xml` do deck anotado em cada bloco. Ler esse arquivo
     antes de mexer em qualquer percentual.
   - **ESCALA: toda barra é lida sobre 100% da base.** Nada é esticado para
     preencher o gráfico. Uma opção citada por 7,9% ocupa 7,9% da pista, e é
     esse o argumento: as ideias de poder interno são um traço fino.
   - 🔴 **Armadilha de cor resolvida com número, não com gosto:** vinho
     `#41181e` com o verde-deep `#14312c` (o verde óbvio da marca) tem separação
     de **ΔE 2,6 em deuteranopia** — as duas barras viram a mesma. Com o
     **`green-soft` #2c5a49** vai a 15,1. O terceiro tom é o **`muted` #8b756a**;
     os três juntos dão 12,1 no pior par. Validado com
     `scripts/validate_palette.js` da skill `dataviz`.
   - **Semântica da cor, que é o que não pode quebrar:** vinho = poder externo,
     verde = poder interno, muted = uma dimensão só / caixa-preta. Por isso
     "clareza profunda sobre quem é" e "inteligência social" (no gráfico de
     escolha forçada) e "Outras respostas" (no de referência) **não são vinho**:
     pintá-las de vinho diria ao leitor que são poder externo.
   - Os 4 gráficos, em ordem de argumento: o que chamam de poder (P20) → em quem
     pensam (a origem do 8,9%) → **o que declaram × o que vivem** (o achado
     central) → o que escolhem com a alternativa na mesa.
   - A marca d'água deixou de ser arquivo: a assinatura no pé de cada gráfico
     entra em qualquer **captura de tela**, que agora é o único jeito de tirar o
     gráfico de lá (não existe mais imagem para salvar com o botão direito).

3. ✅ **O "9% e não 1%" do Igor estava certo, e os dois números existem.**
   São perguntas diferentes:
   - **8,9%** escolheram "Você mesmo(a)" na pergunta **FECHADA** (chart11 do
     deck). É o número dela, e é o que a página publica agora em `stat3`.
   - **1,0%** (4 de 403) escreveram o próprio nome na pergunta **ABERTA** P17.
     Não foi descartado: virou a frase de contraste no subtítulo do gráfico de
     referência, porque a distância entre os dois é o achado.
   ⚠️ Existe outro 8,9% na página, sem relação: é "saber ler situações com
   clareza" na P20. Coincidência de valor.

4. **Fotos — as duas frentes que o Igor apontou.**
   - **Confraria: 16 → 10.** Saíram 6, cada uma repetindo o mesmo instante de
     outra que ficou (2ª cesta de camisetas, 2ª foto do grupo com os braços
     erguidos, 2º grupo no painel de árvores, 2ª mesa do jantar, selfie sobre o
     grupo das sacolas) e 2 delas também com enquadramento ruim (o
     ar-condicionado ocupando o terço de cima; um rosto desfocado tomando um
     terço do quadro). A 6ª saiu num segundo passe: era a **terceira** dupla
     diante do painel de árvores, e no mosaico as três apareciam **lado a lado,
     na mesma linha**. O porquê de cada corte, com o par correspondente, está em
     `prepara-fotos-confraria.mjs`.
     📌 **A ordem do array é funcional, não estética.** `columns` distribui em
     sequência: com 9 fotos na galeria a coluna 1 fica com 1-3, a 2 com 4-6 e a
     3 com 7-9. As duas fotos do painel de árvores estão nas posições **2 e 7**
     para caírem em colunas e alturas diferentes. Mexer na ordem sem pensar
     nisso devolve o problema.
   - 🔴 **A "desconfiguração" do /sobre era um BUG DE LAYOUT, não foto ruim.**
     A galeria forçava TODA foto em 3:4 com `fit("crop")` + `object-cover`. Nas
     **9 fotos horizontais** isso jogava fora mais de 40% da imagem e **cortava
     gente ao meio**: a foto de grupo na alameda de bandeiras da ONU (960×640,
     cerca de 30 pessoas) virava um recorte central com as pontas serradas; a de
     premiação (1320×969, 7 pessoas) sobravam 3. Agora é o mesmo **mosaico da
     /confraria** e nenhuma foto é cortada — as 40 continuam publicadas.
     A query passou a trazer `w`/`h` (`asset->metadata.dimensions`) para
     reservar a altura e não causar CLS.
     ⚠️ **Sem recorte, o `hotspot` do Studio deixa de valer** (ele só escolhe o
     que sobra num corte). Troca consciente: nada cortado.
     ⚠️ O mosaico é `columns`, então a leitura passou a ser **coluna a coluna**,
     não linha a linha. A ordem editorial dela continua agrupada, mas quem
     reordenar no Studio deve saber disso.

5. **/na-midia voltou para a navegação** (menu, rodapé e sitemap), pedido do
   Igor: "vamos começar o processo de divulgação em breve". Tinha saído em
   19/08. O menu passou a 8 itens e ainda cabe no desktop.
   - Para não devolver uma página em branco ao menu, **a lista virou real**:
     `pressListQuery` lê os artigos cuja fonte é veículo EXTERNO
     (`source in ["forbes","linkedin"]` com `sourceUrl`). `youtube` e `original`
     ficam fora de propósito — o canal e os textos são dela, não imprensa.
     Ela alimenta a página pelo mesmo lugar onde já publica, sem schema novo.
   - Hoje há **1 item real** (o artigo da Forbes). O estado vazio continua para
     quando a query não devolver nada. Fecha com CTA de imprensa para /contato.
   - ⚠️ **A lista NÃO mostra data, de propósito.** O `publishedAt` de um artigo
     importado é a data da IMPORTAÇÃO: no da Forbes está 06/08/2026, e a própria
     URL do original diz 16/12/2025. Para ligar a data: corrigir o `publishedAt`
     no Studio e devolver o bloco (está anotado no topo da página).

6. 📌 **Lição de ferramenta (captura de tela):** `Page.captureScreenshot` com
   `captureBeyondViewport` **travava** nas páginas altas (a /sobre com 40 fotos
   passava de 30 megapixels com `deviceScaleFactor: 2`). O que funciona é rolar
   até o seletor e capturar a **viewport pura**, sem clip. E o Next 16 prefetcha
   todo `<Link>`, o que enche a fila de um `python -m http.server` (uma thread):
   bloquear `*_rsc=*` por CDP resolve.

**⏭️ O que ficou pendente desta rodada:**
- **Crédito do instituto da pesquisa** continua sem resposta (o arquivo diz
  "IGB" e "QExpress"; não sei qual é o instituto e qual é o painel, então
  ninguém foi creditado).
- `RESEARCH_URL` na /pesquisa segue `null` (o botão "Conheça a pesquisa" não
  aparece); `TESTIMONIAL` e `CONFRARIA_URL` na /confraria também.
- A `/na-midia` tem 1 item. Palcos e podcasts (NRF, SXSW, BrasaConnect, ONU,
  Gerações Cast) aparecem nas fotos do /sobre mas não existem como documento no
  Sanity.
- **A foto de destaque da /confraria** (roda de conversa) tem uma cabeça
  desfocada ocupando a faixa esquerda do quadro. Em largura inteira isso
  aparece. Ficou porque é foto documental e a Andrea está bem enquadrada, mas é
  candidata a troca se ela mandar outra.
- Ainda **não foi publicado**: as mudanças estão só no repositório local.

---

### 🗓️ Sessão 28/08/2026 (parte 3) — A /pesquisa saiu do placeholder
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
   - ⚠️ **O gráfico nasceu ilegível e foi refeito** (o Igor apontou). Duas causas:
     ele estava numa coluna de `1.5fr` num grid, renderizando a 770px, e o
     desenho fora feito para 1600px, ou seja, tudo caía para 48% do tamanho.
     Agora o gráfico ocupa a **largura inteira** da seção (a metodologia desceu
     para baixo dele) e o desenho subiu de escala (rótulos 23→28, valores
     27→33, título 52→62, altura 1000→1080).
     No **celular** ele não encolhe: mantém `min-w-[760px]` e a caixa rola na
     horizontal, com a dica `chartScrollHint` visível só em tela pequena.
     📌 E o `sizes` do `next/image` precisou casar com isso
     (`(max-width: 760px) 760px, ...`): com `100vw` o Next servia um arquivo de
     503px esticado para 760 e a imagem saía borrada no celular.
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
