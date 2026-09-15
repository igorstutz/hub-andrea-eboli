/**
 * Confere, no site NO AR, cada critério de prontidão para agentes de IA.
 *
 * Uso: node verifica-agentes.mjs [url-base]
 *      (padrão: https://andreaeboli.com)
 *
 * Este projeto não tem suíte de testes — o que ele tem, e usa desde sempre, é
 * conferência contra o alvo real (o `build-painel.mjs` faz o mesmo com o
 * painel). E aqui isso não é preguiça, é o único teste que vale: metade destas
 * regras mora no `.htaccess` e na configuração do servidor, não no código.
 * Um teste unitário passaria verde com o site fora do ar.
 *
 * Sai com código diferente de zero se algum item ESSENCIAL falhar, então serve
 * de portão no workflow de deploy.
 */
const BASE = (process.argv[2] || "https://andreaeboli.com").replace(/\/$/, "");
const PAGINA = `${BASE}/pt/sobre/`;

const resultados = [];

function registra(nome, ok, detalhe, essencial = true) {
  resultados.push({ nome, ok, detalhe, essencial });
}

/**
 * `Vary: Accept-Encoding` CONTÉM a palavra "accept" e passava como se fosse
 * `Vary: Accept` — o verificador dava verde num item que não existia. Por isso
 * a comparação é por item da lista, não por substring.
 */
function variaPorAccept(headers) {
  return (headers.get("vary") || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .includes("accept");
}

async function pega(url, opcoes = {}) {
  try {
    const r = await fetch(url, { redirect: "follow", ...opcoes });
    return { status: r.status, headers: r.headers, corpo: await r.text() };
  } catch (e) {
    return { status: 0, headers: new Headers(), corpo: "", erro: String(e) };
  }
}

// ---------------------------------------------------------------------------
// 1 e 2 — os rastreadores conseguem chegar?
// ---------------------------------------------------------------------------
const AGENTES = [
  "ClaudeBot/1.0 (+claudebot@anthropic.com)",
  "Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)",
  "ChatGPT-User/1.0",
  "Mozilla/5.0 (compatible; Google-Extended)",
  "Mozilla/5.0 (compatible; PerplexityBot/1.0)",
];

for (const ua of AGENTES) {
  const nome = ua.match(/([A-Za-z-]+Bot|ChatGPT-User|Google-Extended)/)?.[1] ?? ua;
  const r = await pega(`${BASE}/pt/`, { headers: { "user-agent": ua } });
  registra(
    `rastreador ${nome}`,
    r.status === 200,
    `HTTP ${r.status}${r.status === 429 ? " (bloqueio de bot na hospedagem)" : ""}`,
  );
}

// ---------------------------------------------------------------------------
// 3 — 404 de verdade, e que ajuda quem caiu nele
// ---------------------------------------------------------------------------
{
  const r = await pega(`${BASE}/caminho-que-nao-existe-${Date.now()}/`);
  registra("404 devolve status 404", r.status === 404, `HTTP ${r.status}`);
  const aponta =
    r.corpo.includes("llms.txt") && r.corpo.includes("sitemap.xml");
  registra(
    "404 aponta o caminho de volta (llms.txt + sitemap)",
    aponta,
    aponta ? "llms.txt e sitemap.xml citados" : "corpo sem as referências",
  );
}

// ---------------------------------------------------------------------------
// 4 — negociação de markdown (acceptmarkdown.com)
// ---------------------------------------------------------------------------
{
  const md = await pega(PAGINA, { headers: { accept: "text/markdown" } });
  const tipo = md.headers.get("content-type") || "";
  registra(
    "Accept: text/markdown devolve markdown",
    md.status === 200 && tipo.includes("text/markdown"),
    `HTTP ${md.status} · ${tipo || "sem content-type"}`,
  );
  registra(
    "o markdown tem o cabeçalho com o canonical",
    md.corpo.startsWith("---") && md.corpo.includes("canonical:"),
    md.corpo.slice(0, 40).replace(/\n/g, " ") || "vazio",
  );
  registra(
    "Vary: Accept na resposta markdown",
    variaPorAccept(md.headers),
    md.headers.get("vary") || "sem Vary",
  );

  const html = await pega(PAGINA, { headers: { accept: "text/html" } });
  const tipoHtml = html.headers.get("content-type") || "";
  registra(
    "Accept: text/html continua devolvendo HTML",
    html.status === 200 && tipoHtml.includes("text/html"),
    `HTTP ${html.status} · ${tipoHtml}`,
  );
  registra(
    "Vary: Accept na resposta HTML",
    variaPorAccept(html.headers),
    html.headers.get("vary") || "sem Vary",
  );

  // q-values: markdown preferido sobre HTML deve vencer.
  const q = await pega(PAGINA, {
    headers: { accept: "text/markdown;q=1.0, text/html;q=0.5" },
  });
  registra(
    "q-value: markdown preferido vence o HTML",
    (q.headers.get("content-type") || "").includes("text/markdown"),
    q.headers.get("content-type") || "sem content-type",
    false,
  );

  const recusa = await pega(PAGINA, { headers: { accept: "application/pdf" } });
  registra(
    "406 para tipo que a rota não produz",
    recusa.status === 406,
    `HTTP ${recusa.status}`,
    false,
  );
}

// ---------------------------------------------------------------------------
// 5 — arquivos de instrução
// ---------------------------------------------------------------------------
{
  const llms = await pega(`${BASE}/llms.txt`);
  registra("llms.txt existe", llms.status === 200, `HTTP ${llms.status}`);
  registra(
    "llms.txt diz QUANDO usar o site",
    /quando usar|when to use/i.test(llms.corpo),
    /quando usar|when to use/i.test(llms.corpo)
      ? "seção presente"
      : "sem a seção de uso",
  );

  const full = await pega(`${BASE}/llms-full.txt`);
  registra(
    "llms-full.txt existe",
    full.status === 200,
    full.status === 200
      ? `HTTP 200 · ${Math.round(full.corpo.length / 1024)} KB`
      : `HTTP ${full.status}`,
    false,
  );

  const robots = await pega(`${BASE}/robots.txt`);
  const nomeados = ["ClaudeBot", "GPTBot"].filter((a) =>
    robots.corpo.includes(a),
  );
  registra(
    "robots.txt nomeia os agentes de IA",
    nomeados.length === 2,
    nomeados.length ? `listados: ${nomeados.join(", ")}` : `HTTP ${robots.status}, nenhum nomeado`,
    false,
  );

  const sitemap = await pega(`${BASE}/sitemap.xml`);
  registra("sitemap.xml existe", sitemap.status === 200, `HTTP ${sitemap.status}`);
}

// ---------------------------------------------------------------------------
// Relatório
// ---------------------------------------------------------------------------
console.log(`\nProntidão para agentes — ${BASE}\n`);

const larguraNome = Math.max(...resultados.map((r) => r.nome.length));
for (const r of resultados) {
  const marca = r.ok ? "✓" : r.essencial ? "✗" : "!";
  console.log(`  ${marca} ${r.nome.padEnd(larguraNome)}  ${r.detalhe}`);
}

const falhas = resultados.filter((r) => !r.ok && r.essencial);
const avisos = resultados.filter((r) => !r.ok && !r.essencial);

console.log(
  `\n${resultados.filter((r) => r.ok).length}/${resultados.length} itens em ordem` +
    (avisos.length ? `  ·  ${avisos.length} aviso(s)` : ""),
);

if (falhas.length) {
  console.error(`\n✗ ${falhas.length} item(ns) essencial(is) falhando:`);
  for (const f of falhas) console.error(`   · ${f.nome} — ${f.detalhe}`);
  process.exit(1);
}
