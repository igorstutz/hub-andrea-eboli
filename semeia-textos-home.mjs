/**
 * Leva os textos da página inicial dos arquivos de tradução para o painel.
 *
 * Uso:  node semeia-textos-home.mjs            (mostra o que faria)
 *       node semeia-textos-home.mjs --gravar   (grava de verdade)
 *
 * 🔴 POR QUE SEMEAR, EM VEZ DE DEIXAR O PAINEL VAZIO (22/09/2026): o site já
 * funcionaria vazio — `src/lib/homeText.ts` cai na tradução em todo campo em
 * branco. Mas a Andrea abriria "Página inicial" e veria 44 campos vazios, sem
 * saber o que cada um controla nem o que está no ar hoje. Semeado, ela abre e
 * encontra o texto atual, edita por cima e publica.
 *
 * 📌 NÃO SOBRESCREVE. Campo já preenchido no painel é mantido: quem editou lá
 * decidiu depois de quem escreveu o arquivo de tradução. Rodar de novo é
 * seguro e só preenche o que falta (é o que fazer quando um campo novo entrar
 * no schema).
 *
 * O token sai do login do CLI da Sanity (`npx sanity login`), o mesmo que o
 * resto dos scripts do projeto usa. Nada é impresso dele.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { homedir } from "node:os";

const PROJECT_ID = "52ssivbg";
const DATASET = "production";
const API = `https://${PROJECT_ID}.api.sanity.io/v2024-10-01`;
const DOC_ID = "homePage";
const GRAVAR = process.argv.includes("--gravar");

// Os campos que o schema `homePage` conhece, na ordem em que aparecem lá.
// Campo de texto simples (localeString/localeText) e campo de lista.
const CAMPOS = [
  "rotatingLabel", "answerLabel", "title", "leadStrong", "lead",
  "ctaPrimary", "ctaSecondary",
  "audienceBadge", "audienceTitle",
  "thesisBadge", "thesisTitle", "thesisP1", "thesisP2", "thesisP3", "thesisP4",
  "questionsTitle", "q1", "q2", "q3",
  "ecpBadge", "ecpTitle", "ecpP1", "ecpP2", "ecpP3", "ecpQuote",
  "dimensionsLabel", "dimensionsTitle",
  "vocabularyLabel", "vocabularyTitle", "vocabularyLead", "sectionCta",
  "newsletterBadge", "newsletterTitle", "newsletterLead", "newsletterCta",
  "newsletterPlaceholder", "newsletterOk", "newsletterError",
];
const LISTAS = [
  "rotatingQuestions",
  "audienceDenial", "audienceAffirmation", "audiencePivot",
  "audienceTurn", "audienceClose",
];

const IDIOMAS = ["pt", "en", "es"];

function token() {
  const cfg = path.join(homedir(), ".config", "sanity", "config.json");
  const t = JSON.parse(readFileSync(cfg, "utf8")).authToken;
  if (!t) {
    console.error("✗ sem token do Sanity. Rode: npx sanity login");
    process.exit(1);
  }
  return t;
}

function mensagens() {
  const out = {};
  for (const loc of IDIOMAS) {
    out[loc] = JSON.parse(readFileSync(`messages/${loc}.json`, "utf8")).home;
  }
  return out;
}

// `_key` é obrigatório em item de array no Sanity; sem ele o Studio reclama
// ("Missing keys") e a edição por arrastar não funciona.
function chaveCurta(i) {
  return `k${String(i).padStart(2, "0")}`;
}

const TOKEN = token();
const H = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };

const msg = mensagens();

// O que já existe no painel (para não sobrescrever).
const atual = await (async () => {
  const q = encodeURIComponent(`*[_id == "${DOC_ID}"][0]`);
  const r = await fetch(`${API}/data/query/${DATASET}?query=${q}`, { headers: H });
  const j = await r.json();
  if (!r.ok) {
    console.error("✗ não consegui ler o documento:", JSON.stringify(j).slice(0, 300));
    process.exit(1);
  }
  return j.result ?? null;
})();

console.log(
  atual
    ? `→ o documento "${DOC_ID}" já existe; só preencho o que estiver vazio\n`
    : `→ o documento "${DOC_ID}" ainda não existe; vou criá-lo\n`,
);

const doc = { _id: DOC_ID, _type: "homePage" };
const novos = [];
const mantidos = [];

for (const campo of CAMPOS) {
  if (atual?.[campo]?.pt) {
    mantidos.push(campo);
    continue;
  }
  const valor = {};
  for (const loc of IDIOMAS) {
    const v = msg[loc][campo];
    if (typeof v === "string") valor[loc] = v;
  }
  if (Object.keys(valor).length) {
    doc[campo] = valor;
    novos.push(campo);
  }
}

for (const campo of LISTAS) {
  if (Array.isArray(atual?.[campo]) && atual[campo].length) {
    mantidos.push(campo);
    continue;
  }
  const pt = msg.pt[campo];
  if (!Array.isArray(pt)) continue;
  doc[campo] = pt.map((_, i) => {
    const item = { _type: "localeString", _key: chaveCurta(i) };
    for (const loc of IDIOMAS) {
      const lista = msg[loc][campo];
      if (Array.isArray(lista) && typeof lista[i] === "string") item[loc] = lista[i];
    }
    return item;
  });
  novos.push(`${campo}[${doc[campo].length}]`);
}

console.log(`campos a preencher (${novos.length}):`);
for (const c of novos) console.log(`   + ${c}`);
if (mantidos.length) {
  console.log(`\ncampos mantidos como estão (${mantidos.length}): ${mantidos.join(", ")}`);
}

if (!GRAVAR) {
  console.log("\n(simulação — nada foi gravado. Rode com --gravar para valer.)");
  process.exit(0);
}
if (!novos.length) {
  console.log("\nnada a fazer.");
  process.exit(0);
}

// `createOrReplace` com o documento inteiro apagaria o que foi mantido, então
// a gravação é um patch: cria o documento se faltar e só escreve os campos
// novos por cima.
const mutations = [
  { createIfNotExists: { _id: DOC_ID, _type: "homePage" } },
  { patch: { id: DOC_ID, set: Object.fromEntries(Object.entries(doc).filter(([k]) => !k.startsWith("_"))) } },
];

const r = await fetch(`${API}/data/mutate/${DATASET}?returnIds=true`, {
  method: "POST",
  headers: H,
  body: JSON.stringify({ mutations }),
});
const j = await r.json();
if (!r.ok) {
  console.error("\n✗ falhou:", JSON.stringify(j).slice(0, 500));
  process.exit(1);
}
console.log(`\n✓ gravado em ${DOC_ID} (${novos.length} campos)`);
console.log("  o painel mostra em: Conteúdo → Página inicial");
console.log("  ⚠️ o site só muda depois de PUBLICAR no painel e o deploy rodar (até ~30 min)");
