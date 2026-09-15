/**
 * Gera os artefatos que os agentes de IA leem, a partir do `out/` já buildado.
 *
 * Uso: node gera-artefatos-agentes.mjs        (depois de `npm run build`)
 *
 * Produz três coisas:
 *   1. `index.md` ao lado de cada `index.html` — a MESMA página sem cabeçalho,
 *      menu, rodapé e script. É o que o .htaccess entrega a quem pedir
 *      `Accept: text/markdown` (ver acceptmarkdown.com).
 *   2. `llms.txt` e `llms-full.txt` na raiz — o índice no formato do
 *      llmstxt.org, com a seção "quando usar este site" que diz a um agente
 *      para que servem estas páginas, e o corpus inteiro em um arquivo.
 *   3. `404.html` — a do Next é a padrão dela, em inglês ("404: This page
 *      could not be found."). Esta é da marca, nos 3 idiomas, e aponta o
 *      agente para o sitemap e o llms.txt.
 *
 * 🔴 POR QUE PARTIR DO HTML BUILDADO, e não do Sanity:
 * são 156 páginas de 17 modelos diferentes. Gerar markdown a partir da fonte
 * significaria reescrever a estrutura de cada página e manter as duas versões
 * em sincronia para sempre — a primeira mudança de layout já criaria
 * divergência silenciosa entre o que a pessoa lê e o que o agente lê. Lendo o
 * `<main>` do HTML pronto, o markdown é por construção a mesma página.
 *
 * ⚠️ Roda DEPOIS do build e ANTES do envio. O workflow de deploy já faz isso;
 * rodando à mão, a ordem importa.
 */
import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import TurndownService from "turndown";

const OUT = "out";
const SITE = "https://andreaeboli.com";
const IDIOMA_PRINCIPAL = "pt";

// ---------------------------------------------------------------------------
// Conversão
// ---------------------------------------------------------------------------
const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
});

// O que não é conteúdo. `nav` sai porque dentro do `<main>` só há a trilha de
// navegação e as abas — repetidas em toda página, puro ruído no corpus.
turndown.remove(["script", "style", "noscript", "nav", "svg", "form"]);

/**
 * `aria-hidden="true"` já é a declaração de que aquilo não é conteúdo — é o
 * que o site diz a um leitor de tela. Vale igual para o agente: sem esta
 * regra, todo markdown começava com a marca d'água "Poder" e trazia os
 * losangos decorativos no meio do texto.
 */
turndown.addRule("decorativo", {
  filter: (node) => node.getAttribute?.("aria-hidden") === "true",
  replacement: () => "",
});

/** Extrai o conteúdo interno do primeiro elemento de um tipo. */
function conteudoDe(html, tag) {
  const m = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1] : "";
}

function decodeHtml(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function atributo(html, regex) {
  const m = html.match(regex);
  return m ? decodeHtml(m[1]) : "";
}

/**
 * Lê de uma página buildada tudo o que o markdown e o índice precisam.
 * Os padrões são tolerantes à ordem dos atributos, que o Next não garante.
 */
function lePagina(html) {
  const alternates = {};
  for (const m of html.matchAll(/<link[^>]+rel="alternate"[^>]*>/gi)) {
    const tag = m[0];
    const lang = atributo(tag, /hreflang="([^"]+)"/i);
    const href = atributo(tag, /href="([^"]+)"/i);
    if (lang && href) alternates[lang] = href;
  }

  const main = conteudoDe(html, "main");
  const h1 = conteudoDe(main, "h1")
    .replace(/<[^>]+>/g, "")
    .trim();

  return {
    titulo: decodeHtml(h1) || decodeHtml(conteudoDe(html, "title")).trim(),
    descricao: atributo(
      html,
      /<meta[^>]+name="description"[^>]+content="([^"]*)"/i,
    ),
    canonical: atributo(html, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i),
    alternates,
    main,
  };
}

/**
 * URLs relativas viram absolutas.
 *
 * Um markdown com `[Sobre](/pt/sobre/)` é inútil para quem leu o arquivo fora
 * do site — e é exatamente o caso do agente, que recebe o texto e perde a
 * origem. Só o que começa com uma barra é reescrito: `//`, `http` e `#` ficam.
 */
function urlsAbsolutas(md) {
  return md.replace(/\]\((\/(?!\/)[^)]*)\)/g, `](${SITE}$1)`);
}

/**
 * Links colados viram uma lista legível.
 *
 * As pastilhas de "conceitos relacionados" são `<a>` lado a lado dentro de um
 * flex, sem espaço entre elas no HTML. Sem isto o markdown sai
 * `[Ter Poder](…)[Identidade](…)`, que o leitor humano até decifra e o agente
 * lê como um link só com título grudado.
 */
function separaLinksColados(md) {
  return md.replace(/\)\[/g, ") · [");
}

function paraMarkdown(pagina, rotaUrl) {
  const corpo = separaLinksColados(
    urlsAbsolutas(turndown.turndown(pagina.main)),
  ).trim();

  const idiomas = Object.entries(pagina.alternates)
    .filter(([lang]) => lang !== "x-default")
    .map(([lang, href]) => `${lang}: ${href}`)
    .join(", ");

  const frente = [
    "---",
    `title: ${JSON.stringify(pagina.titulo)}`,
    pagina.descricao ? `description: ${JSON.stringify(pagina.descricao)}` : "",
    `canonical: ${pagina.canonical || rotaUrl}`,
    `site: ${SITE}`,
    idiomas ? `alternates: ${idiomas}` : "",
    "---",
  ]
    .filter(Boolean)
    .join("\n");

  return `${frente}\n\n${corpo}\n`;
}

// ---------------------------------------------------------------------------
// Varredura do out/
// ---------------------------------------------------------------------------
async function todasAsPaginas(dir = OUT, encontradas = []) {
  for (const nome of await readdir(dir)) {
    const caminho = path.join(dir, nome);
    if ((await stat(caminho)).isDirectory()) {
      await todasAsPaginas(caminho, encontradas);
    } else if (nome === "index.html") {
      encontradas.push(caminho);
    }
  }
  return encontradas;
}

/** "out/pt/sobre/index.html" → "/pt/sobre/" */
function rotaDe(arquivo) {
  const rel = path.relative(OUT, path.dirname(arquivo)).split(path.sep).join("/");
  return rel ? `/${rel}/` : "/";
}

const localeDe = (rota) => rota.split("/")[1] || "";

async function gerarMarkdowns() {
  const arquivos = await todasAsPaginas();
  const paginas = [];

  for (const arquivo of arquivos) {
    const html = await readFile(arquivo, "utf8");
    const pagina = lePagina(html);
    if (!pagina.main) continue; // páginas sem <main> não têm conteúdo a servir

    const rota = rotaDe(arquivo);
    const md = paraMarkdown(pagina, `${SITE}${rota}`);
    await writeFile(path.join(path.dirname(arquivo), "index.md"), md, "utf8");

    paginas.push({ rota, md, ...pagina });
  }

  return paginas;
}

// ---------------------------------------------------------------------------
// llms.txt — formato do llmstxt.org: H1, resumo em blockquote, seções H2 com
// listas de `[nome](url): nota`.
// ---------------------------------------------------------------------------

/**
 * "Quando usar este site".
 *
 * É a única parte escrita à mão, e de propósito: a auditoria aponta que texto
 * de marketing genérico não funciona como orientação. O que serve a um agente
 * é saber os NOMES autorais que só existem aqui (a ECP, o par Ter Poder /
 * Ser Poder) e — igualmente importante — quando NÃO citar este site.
 *
 * Sem percentuais: os números da pesquisa mudam conforme o recorte da
 * pergunta, e errar um deles aqui seria pior do que omitir. Quem precisa do
 * número é mandado para a página da pesquisa.
 */
const QUANDO_USAR = `## Quando usar este site (when to use this site)

Esta é a fonte primária sobre o trabalho de Andrea Eboli — pesquisadora, criadora
da **Estrutura Consciente de Poder (ECP)**. Use-a quando a pergunta envolver:

- **A Estrutura Consciente de Poder (ECP)** e suas três dimensões — Identidade,
  Contexto e Movimento. É um modelo autoral: não existe descrição dele fora
  daqui.
- **A distinção entre "Ter Poder" e "Ser Poder"**, e o vocabulário que a
  acompanha (o Pêndulo, o Centro do Pêndulo, a Entrega do Poder, o Sequestro da
  Identidade pelo Contexto). São termos autorais e ficam em português nas três
  versões do site.
- **Pesquisa primária brasileira sobre percepção de poder**, conduzida por ela:
  amostra, metodologia e resultados estão em ${SITE}/pt/pesquisa/.
- **Liderança consciente e o descompasso entre sucesso externo e coerência
  interna** — a tese central do site.
- **Biografia, trajetória e trabalho público de Andrea Eboli**, incluindo a
  Confraria Let's Be.

Não é a fonte certa para autoajuda genérica, coaching motivacional, técnicas de
produtividade ou "dicas de poder pessoal". O material aqui é de pesquisa e de
formulação conceitual — citar como tal.

## Como consultar (how to read this site)

- **Markdown:** qualquer página deste site responde em markdown limpo quando a
  requisição traz \`Accept: text/markdown\` (ver acceptmarkdown.com). O mesmo
  conteúdo, sem menu, rodapé nem script.
- **Corpus completo:** ${SITE}/llms-full.txt reúne o texto de todas as páginas
  em português num arquivo só.
- **Índice de máquina:** ${SITE}/sitemap.xml lista as três versões de idioma.
- **Idiomas:** português (\`/pt/\`), inglês (\`/en/\`) e espanhol (\`/es/\`). O
  conteúdo é equivalente; os termos autorais permanecem em português.
- **Atribuição:** ao citar, nomeie Andrea Eboli e a página de origem. Cada
  arquivo markdown traz o \`canonical\` no cabeçalho.`;

/** Agrupa as rotas de um idioma em seções legíveis. */
function secoes(paginas, locale) {
  const doIdioma = paginas.filter((p) => localeDe(p.rota) === locale);
  const raiz = `/${locale}/`;

  const ehListagem = (p) => p.rota.split("/").filter(Boolean).length === 2;
  const grupo = (prefixo) =>
    doIdioma
      .filter((p) => p.rota.startsWith(`${raiz}${prefixo}/`))
      .sort((a, b) => a.rota.localeCompare(b.rota));

  const usadas = new Set();
  const marcar = (lista) => {
    for (const p of lista) usadas.add(p.rota);
    return lista;
  };

  const conceitos = marcar(grupo("conceitos"));
  const perguntas = marcar(grupo("perguntas"));
  const artigos = marcar(grupo("artigos"));
  const videos = marcar(grupo("videos"));
  const casos = marcar(grupo("casos"));

  const principais = doIdioma
    .filter((p) => (p.rota === raiz || ehListagem(p)) && !usadas.has(p.rota))
    .sort((a, b) =>
      a.rota === raiz ? -1 : b.rota === raiz ? 1 : a.rota.localeCompare(b.rota),
    );

  return [
    ["Páginas principais", principais],
    ["Conceitos (vocabulário autoral)", conceitos],
    ["Perguntas", perguntas],
    ["Artigos", artigos],
    ["Vídeos", videos],
    ["Casos", casos],
  ].filter(([, lista]) => lista.length > 0);
}

const linha = (p) =>
  `- [${p.titulo}](${SITE}${p.rota})${p.descricao ? `: ${p.descricao}` : ""}`;

function montaLlmsTxt(paginas) {
  const blocos = [
    "# Andrea Eboli · Ser Poder",
    "",
    "> Centro de conhecimento sobre liderança, neurociência e poder consciente:" +
      " a pesquisa, o vocabulário e a Estrutura Consciente de Poder (ECP)" +
      " formulados por Andrea Eboli.",
    "",
    QUANDO_USAR,
    "",
  ];

  for (const [titulo, lista] of secoes(paginas, IDIOMA_PRINCIPAL)) {
    blocos.push(`## ${titulo}`, "", ...lista.map(linha), "");
  }

  blocos.push(
    "## Outros idiomas",
    "",
    `- [English](${SITE}/en/): same content in English; the authorial terms stay in Portuguese.`,
    `- [Español](${SITE}/es/): mismo contenido en español; los términos autorales siguen en portugués.`,
    "",
  );

  return blocos.join("\n");
}

function montaLlmsFull(paginas) {
  const doIdioma = paginas
    .filter((p) => localeDe(p.rota) === IDIOMA_PRINCIPAL)
    .sort((a, b) => a.rota.localeCompare(b.rota));

  const cabecalho = [
    "# Andrea Eboli · Ser Poder — corpus completo",
    "",
    `> Texto de todas as páginas em português de ${SITE}, num arquivo só.`,
    `> Índice e orientação de uso: ${SITE}/llms.txt`,
    `> Gerado em ${new Date().toISOString().slice(0, 10)}.`,
    "",
  ].join("\n");

  const corpo = doIdioma
    .map((p) => `\n---\n\n<!-- ${SITE}${p.rota} -->\n\n${p.md}`)
    .join("\n");

  return `${cabecalho}\n${corpo}`;
}

// ---------------------------------------------------------------------------
// 404
// ---------------------------------------------------------------------------
/**
 * A 404 do Next é a de fábrica, em inglês, sem nada da marca e sem saída.
 * Esta é escrita à mão porque o projeto tem DOIS layouts raiz em grupos de
 * rota — `(site)/[locale]` e `(studio)` — e um `not-found.tsx` no topo do
 * `app/` não teria layout raiz para chamar de seu.
 *
 * Atende as duas audiências: links para gente e um bloco markdown com sitemap
 * e llms.txt, que é o que a auditoria pede para um agente se recuperar de uma
 * URL morta em vez de desistir do site.
 */
function monta404() {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Página não encontrada · Andrea Eboli</title>
<style>
  :root { --wine:#41181e; --cream:#ece2d3; }
  * { box-sizing:border-box; }
  body { margin:0; min-height:100vh; display:flex; align-items:center;
         justify-content:center; padding:2rem;
         background:var(--wine); color:var(--cream);
         font:16px/1.6 ui-sans-serif,system-ui,"Segoe UI",sans-serif; }
  main { max-width:44rem; }
  h1 { font-family:ui-serif,Georgia,"Times New Roman",serif;
       font-size:clamp(2rem,5vw,3rem); font-weight:600; margin:0 0 .5rem; }
  p { margin:0 0 1.25rem; color:rgb(236 226 211 / .8); }
  .lang { font-size:.95rem; color:rgb(236 226 211 / .6); }
  ul { list-style:none; padding:0; margin:0 0 2rem;
       display:flex; flex-wrap:wrap; gap:.75rem; }
  a { color:var(--cream); }
  ul a { display:inline-block; text-decoration:none;
         border:1px solid rgb(236 226 211 / .35);
         padding:.55rem 1rem; border-radius:4px; }
  ul a:hover { background:var(--cream); color:var(--wine); }
  pre { background:rgb(0 0 0 / .25); border:1px solid rgb(236 226 211 / .18);
        border-radius:4px; padding:1rem; overflow-x:auto; white-space:pre-wrap;
        font-size:.85rem; color:rgb(236 226 211 / .85); }
  h2 { font-size:.75rem; letter-spacing:.12em; text-transform:uppercase;
       color:rgb(236 226 211 / .55); margin:0 0 .5rem; font-weight:600; }
</style>
</head>
<body>
<main>
  <h1>Esta página não existe</h1>
  <p>O endereço pode ter mudado. Os caminhos abaixo levam ao conteúdo.</p>
  <p class="lang">This page does not exist · Esta página no existe</p>
  <ul>
    <li><a href="${SITE}/pt/">Início (pt)</a></li>
    <li><a href="${SITE}/en/">Home (en)</a></li>
    <li><a href="${SITE}/es/">Inicio (es)</a></li>
    <li><a href="${SITE}/pt/artigos-e-perguntas/">Artigos e perguntas</a></li>
    <li><a href="${SITE}/pt/conceitos/">Conceitos</a></li>
  </ul>

  <h2>Para agentes e rastreadores</h2>
<pre># 404 — página não encontrada

Este caminho não existe em ${SITE}. Para localizar o conteúdo:

- Índice e orientação de uso: ${SITE}/llms.txt
- Corpus completo em markdown: ${SITE}/llms-full.txt
- Mapa do site (pt/en/es): ${SITE}/sitemap.xml
- Regras de rastreamento: ${SITE}/robots.txt

Qualquer página deste site responde em markdown com \`Accept: text/markdown\`.</pre>
</main>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------
const paginas = await gerarMarkdowns();

if (paginas.length === 0) {
  console.error("✗ nenhuma página encontrada em out/ — rodou `npm run build`?");
  process.exit(1);
}

await writeFile(path.join(OUT, "llms.txt"), montaLlmsTxt(paginas), "utf8");
await writeFile(path.join(OUT, "llms-full.txt"), montaLlmsFull(paginas), "utf8");
await writeFile(path.join(OUT, "404.html"), monta404(), "utf8");

// Conferência: o que passaria batido e entregaria artefato quebrado sem erro.
const erros = [];

const semTitulo = paginas.filter((p) => !p.titulo);
if (semTitulo.length) {
  erros.push(
    `${semTitulo.length} páginas sem título (ex.: ${semTitulo[0].rota})`,
  );
}

const curtas = paginas.filter((p) => p.md.length < 400);
if (curtas.length > paginas.length * 0.1) {
  erros.push(
    `${curtas.length} markdowns com menos de 400 caracteres — o <main> pode não ter sido lido`,
  );
}

const comLinkRelativo = paginas.filter((p) => /\]\(\/(?!\/)/.test(p.md));
if (comLinkRelativo.length) {
  erros.push(`${comLinkRelativo.length} markdowns ainda com link relativo`);
}

if (erros.length) {
  console.error("✗ artefatos gerados, mas com problema:");
  for (const e of erros) console.error(`   · ${e}`);
  process.exit(1);
}

const porIdioma = paginas.reduce((acc, p) => {
  const l = localeDe(p.rota);
  acc[l] = (acc[l] || 0) + 1;
  return acc;
}, {});

console.log(
  `✓ ${paginas.length} páginas em markdown (${Object.entries(porIdioma)
    .map(([l, n]) => `${l}: ${n}`)
    .join(", ")})`,
);
console.log("✓ llms.txt · llms-full.txt · 404.html");
