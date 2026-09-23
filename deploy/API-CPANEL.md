# O serviço de ingestão no cPanel ("Setup Node.js App")

> Guia de configuração, passo a passo, para o serviço que atende a ferramenta
> **"Importar de link"** do painel em https://andreaeboli.com/admin.
> Escrito em 21/09/2026. O código está em `servidor-ingest/app.ts` +
> `src/lib/ingest/`; o empacotamento em `build-api.mjs`; o envio no modo
> `enviar-api` do workflow "Deploy (andreaeboli.com)".

## Por que existe

O site é estático. As rotas de `/api/ingest/*` que a ferramenta chama só
existiam no `npm run dev` da máquina do Igor, então a Andrea não conseguia
importar um vídeo sozinha. A hospedagem (nuvemHospedagem, cPanel + LiteSpeed)
tem **"Setup Node.js App"** (conferido na tela do cPanel em 21/09/2026), que
roda um app Node atrás do servidor web. O serviço é montado em
**andreaeboli.com/api**, mesmo domínio do painel: sem CORS, sem custo extra.

O que muda em relação ao dev local:

| | `npm run dev` (Igor) | serviço no cPanel (Andrea) |
|---|---|---|
| Rotas | Next.js, `src/app/api/ingest/*` | `dist-api/app.js` (mesmos handlers) |
| Legenda do YouTube | `yt-dlp` (IP residencial) | **Supadata** (`TRANSCRIPT_PROVIDER=supadata`) |
| Whisper (áudio) | disponível | **não** (exige yt-dlp + ffmpeg) |
| Autenticação | token de sessão do Studio | token de sessão do Studio (igual) |

## Passo 1 — Criar o app no cPanel

cPanel → **Software → Setup Node.js App → Create Application**.

| Campo | Valor | Observação |
|---|---|---|
| Node.js version | a **mais nova disponível, no mínimo 18** | o bundle usa `fetch`/`Request`/`FormData` globais, que existem a partir do 18 |
| Application mode | **Production** | |
| Application root | `public_html/ingest-api` | **dentro** de `public_html`, de propósito: é publicado pela mesma conta de FTP do site, sem conta nem secret novo. Um `.htaccess` que vai junto nega acesso HTTP à pasta; o Passenger lê pelo disco |
| Application URL | `andreaeboli.com` + `/api` | o cPanel cria `public_html/api/.htaccess` com o bloco "CLOUDLINUX PASSENGER CONFIGURATION". **Não apagar** (o deploy do site já exclui `api/**` e `ingest-api/**`) |
| Application startup file | `app.js` | |
| Passenger log file | (opcional) `ingest-api/passenger.log` | ajuda a depurar sem SSH |

Clique em **Create**. Depois, na mesma tela, **Environment variables → Add
Variable**, uma por linha:

| Variável | Valor | Para quê |
|---|---|---|
| `ANTHROPIC_API_KEY` | a chave da Anthropic (a mesma do `.env.local`) | gerar os rascunhos |
| `TRANSCRIPT_PROVIDER` | `supadata` | legenda do YouTube em servidor |
| `SUPADATA_API_KEY` | chave em https://dash.supadata.ai (ver Passo 3) | idem |
| `SUPADATA_MODE` | `native` | só legenda existente (1 crédito). `auto` transcreve por IA a 2 créditos/min: caro |
| `ANTHROPIC_MODEL` | (opcional) | sobrescreve o modelo padrão `claude-opus-4-8` |
| `INGEST_ALLOWED_ORIGINS` | (opcional) | outras origens além de `andreaeboli.sanity.studio`, separadas por vírgula |

**Não definir** `OPENAI_API_KEY` aqui: sem yt-dlp/ffmpeg o Whisper não
funciona no servidor, e a chave só faria o serviço prometer um botão que falha.

Clique em **Save**. Ainda não há `app.js`, então **Start/Restart vai falhar —
é esperado**. O arquivo entra no Passo 3.

Não há conta de FTP nem secret novo a criar: o envio usa a conta do site
(`FTP_USER`/`FTP_PASSWORD`, escopada em `public_html`), e o app mora em
`public_html/ingest-api`, dentro do alcance dela. O deploy do site exclui
`ingest-api/**` e `api/**`, então republicar o site não toca no serviço.

## Passo 2 — Chave da Supadata

A conta já existe (criada em 21/09/2026) e a chave está no `.env.local` da
máquina do Igor, onde foi testada com um vídeo real. Falta só copiar a mesma
chave para a variável `SUPADATA_API_KEY` do Passo 1 (dashboard:
https://dash.supadata.ai → API key). Plano **Free: 100 créditos/mês**, sem
cartão; menor plano pago US$ 5/mês (supadata.ai/pricing, 21/09/2026).

Custo real: **1 legenda = 1 crédito** em `mode=native`, mais **1 crédito de
metadados** (duração, data, descrição) quando a página do YouTube não
responde, o que em servidor é sempre. Ou seja, **2 créditos por vídeo
importado**; o volume esperado do hub (5 a 30 vídeos/mês) cabe no plano
grátis. O dashboard mostra o consumo por requisição.

## Passo 3 — Publicar o serviço

GitHub → Actions → **Deploy (andreaeboli.com)** → Run workflow → modo
**`enviar-api`** (ou `gh workflow run deploy-hospedagem.yml -f modo=enviar-api`).

O workflow empacota (`node build-api.mjs`), sobe `dist-api/` por FTPS para
`public_html/ingest-api/` e confere `https://andreaeboli.com/api/ingest/health`.
A resposta esperada:

```json
{"ok":true,"service":"ingest","build":"2026-…","node":"v22.…",
 "anthropic":true,"transcript":{"provider":"supadata","whisper":false},
 "sanity":{"projectId":"52ssivbg","dataset":"production"}}
```

Se `anthropic` vier `false` ou `provider` vier `ytdlp`, é variável faltando no
Passo 1. Se der 503/500 na primeira vez, voltar ao cPanel e clicar em
**Restart** no app (o `tmp/restart.txt` do envio faz isso sozinho nos
envios seguintes; na primeira criação o Passenger pode precisar do clique).

Sem sessão, `POST /api/ingest/generate` tem de responder **401**: é a prova de
que a autenticação está ativa.

## Passo 4 — Republicar o painel

O painel só mostra a ferramenta quando foi buildado sabendo onde está o
serviço (`SANITY_STUDIO_INGEST_API_URL=/api`, gravado pelo `build-painel.mjs`).
Rodar o workflow no modo **`enviar-painel`**. Abrir
https://andreaeboli.com/admin → o item **"Importar de link"** aparece no menu
superior. Ao abrir, a ferramenta sonda o `/api/ingest/health` e mostra na tela
se o serviço está fora ou sem chave.

## Depois de publicar no painel: o site se republica sozinho

O site é estático, então publicar um documento no painel não põe a página no
ar por si só. Desde 22/09/2026 o workflow se encarrega disso: o job
`verificar` compara a data da última publicação e o total de documentos
publicados no Sanity com o `content-version.txt` que o último deploy deixou
em https://andreaeboli.com/content-version.txt. Se mudou, o modo
`enviar-arquivos` roda inteiro (uns 20 min); se não, o run termina em
segundos. Nenhuma ação manual.

🔴 **Mas a frequência real não é a declarada.** O `schedule` pede a cada 30
minutos; medido em 23/09/2026, os disparos reais saem com **3 a 6 horas de
intervalo** — o GitHub descarta a maioria dos agendamentos em repositórios de
pouca atividade. O mecanismo funciona (8 disparos, todos com sucesso, pulando
o deploy quando nada mudou), mas a página nova pode levar horas para aparecer.
**Quem resolve isso é o webhook abaixo.**

### Recomendado: disparar na hora (webhook do Sanity)

O workflow também aceita `repository_dispatch` do tipo `sanity-publish`. Para
o Sanity chamá-lo a cada publicação, é preciso um token do GitHub, que só o
Igor pode criar:

1. GitHub → Settings → Developer settings → **Fine-grained personal access
   tokens** → Generate. Repositório: só `igorstutz/hub-andrea-eboli`.
   Permissões: **Actions: Read and write** (mais nada). Validade: a maior
   possível; anotar a data para renovar.
2. Sanity → https://www.sanity.io/manage/project/52ssivbg/api → **Webhooks →
   Create webhook**:
   - URL: `https://api.github.com/repos/igorstutz/hub-andrea-eboli/dispatches`
   - Dataset: `production` · Trigger on: **Create, Update, Delete**
   - Filter: `!(_id in path("drafts.**")) && _type != "aiSettings"`
   - Projection: `{"event_type": "sanity-publish"}`
   - HTTP method: POST · Headers: `Authorization: Bearer <token>` e
     `Accept: application/vnd.github+json`
3. Publicar qualquer coisa e conferir em GitHub → Actions se apareceu um run
   com evento `repository_dispatch`.

O `concurrency` do workflow faz o debounce: várias publicações seguidas viram
no máximo um deploy rodando e um na fila.

## Como o serviço se protege

- **Sessão do Sanity, não segredo.** A ferramenta manda o token de sessão do
  próprio Studio; o serviço pergunta a
  `https://52ssivbg.api.sanity.io/v2024-10-01/users/me` quem é, e só aceita
  membro do projeto com papel de escrita (`administrator`, `editor`,
  `developer`, `contributor`). `viewer` recebe 403. Detalhes em
  `src/lib/ingest/auth.ts`.
- **Nenhuma chave no bundle.** O `build-api.mjs` procura assinaturas de chave
  (Anthropic, OpenAI, Sanity) em `app.js` e falha se achar.
- **Pasta do app fechada por HTTP.** `public_html/ingest-api/.htaccess` tem
  `Require all denied`; o Passenger lê os arquivos pelo disco. Mesmo que a
  regra não valesse, o que ficaria exposto é código, não chave.
- **Gravação continua no Studio.** O serviço devolve os documentos; quem grava
  os rascunhos é a sessão da editora, no navegador.

## O que foi verificado no ar (21/09/2026) e o que ficou em aberto

1. **Node oferecido:** o app foi criado com **18.20.8**. O bundle é CommonJS,
   alvo Node 18, e subiu sem ajuste.
2. **O prefixo `/api` chega ao app** (a inspeção autenticada por
   `/api/ingest/youtube/inspect` respondeu 200 pelo servidor). O roteador
   aceita os dois casos, com ou sem `/api`.
3. ~~Timeout do LiteSpeed/Passenger~~ **Medido em 21/09/2026: o LiteSpeed
   corta aos ~120 s** ("500 Request Timeout … increase 'Connection
   Timeout'"). Por isso a geração é um **job**: `POST /api/ingest/generate`
   responde 202 com um id e o painel consulta `GET /api/ingest/generate/<id>`
   a cada 3 s (ver `src/lib/ingest/jobs.ts`). Nenhuma outra rota chega perto
   do limite.
4. **`tmp/restart.txt` no LiteSpeed.** No primeiro envio o serviço subiu
   sozinho (o health passou a responder o nosso JSON em vez do "It works!" do
   cPanel). Se um envio futuro não reiniciar o app, o botão **Reiniciar** do
   cPanel resolve.
5. **A pasta do app está fechada por HTTP:** `/ingest-api/app.js` e
   `/ingest-api/` respondem **403** (antes do envio, o `app.js` placeholder
   do cPanel respondia 200 — a pasta nasce aberta; é o nosso `.htaccess` que
   a fecha).

## Testar na máquina local

```powershell
node build-api.mjs
$env:PORT = "8787"; node dist-api/app.js
# em outro terminal:
curl http://localhost:8787/ingest/health
curl -X POST http://localhost:8787/ingest/generate -H "content-type: application/json" -d "{}"   # → 401
```

Com `TRANSCRIPT_PROVIDER` vazio o serviço local usa o yt-dlp, como o dev.
