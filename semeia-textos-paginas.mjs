/**
 * Leva os textos das páginas fixas dos arquivos de tradução para o painel.
 *
 * Uso:  node semeia-textos-paginas.mjs            (mostra o que faria)
 *       node semeia-textos-paginas.mjs --gravar   (grava de verdade)
 *
 * Substitui o `semeia-textos-home.mjs` (23/09/2026), que fazia isto só para a
 * home, com a lista de campos copiada à mão. Agora a lista vem de
 * `src/sanity/pageTextDefs.ts`, a mesma de onde sai o schema do painel.
 *
 * 🔴 POR QUE SEMEAR, EM VEZ DE DEIXAR O PAINEL VAZIO: o site já funcionaria
 * vazio (`src/lib/pageText.ts` cai na tradução em todo campo em branco). Mas a
 * Andrea abriria cada página e veria dezenas de campos vazios, sem saber o que
 * cada um controla nem o que está no ar hoje. Semeado, ela encontra o texto
 * atual, edita por cima e publica.
 *
 * 📌 NÃO SOBRESCREVE. Campo já preenchido no painel é mantido: quem editou lá
 * decidiu depois de quem escreveu o arquivo de tradução. Rodar de novo é
 * seguro e só preenche o que falta — é o que fazer quando um campo novo entrar
 * em `pageTextDefs.ts`.
 *
 * O que ele preenche, por tipo de campo:
 *   textos e listas → do `messages/<idioma>.json`
 *   percentuais     → de `src/lib/researchData.ts`
 *   fotos (imgs)    → as fotos de `public/confraria/`, na ordem e com os alts
 *                     da constante PHOTOS da página (sobe cada arquivo uma vez)
 *   url e img       → ficam vazios (vazio já quer dizer "sem link" / "a imagem
 *                     atual do site")
 *
 * 🔧 E conserta um tropeço do script antigo: ele gravava os itens das listas
 * longas (`audienceDenial`…) com `_type: "localeString"`, enquanto o schema
 * declara `localeText`. O Studio mostrava esses itens como inválidos. Aqui o
 * `_type` de cada item passa a bater com o schema.
 *
 * O token sai do login do CLI da Sanity (`npx sanity login`). Nada é impresso.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { homedir } from "node:os";
import { PAGE_DEFS, fieldNameFor } from "./src/sanity/pageTextDefs.ts";
import {
  POWER_IDEAS,
  POWER_REFERENCE,
  DECLARED_VS_LIVED,
  FORCED_CHOICE,
} from "./src/lib/researchData.ts";

const PROJECT_ID = "52ssivbg";
const DATASET = "production";
const API = `https://${PROJECT_ID}.api.sanity.io/v2024-10-01`;
const GRAVAR = process.argv.includes("--gravar");
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
const H = { Authorization: `Bearer ${token()}` };

// ------------------------------------------------------------ fontes
const MSG = Object.fromEntries(
  IDIOMAS.map((l) => [l, JSON.parse(readFileSync(`messages/${l}.json`, "utf8"))]),
);

/** Achata um namespace: `{ questions: { name } }` → `{ questionsName }`. */
function achatar(obj, prefix, base = "", out = {}) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const chave = base ? `${base}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) achatar(v, prefix, chave, out);
    else out[fieldNameFor(chave, prefix)] = v;
  }
  return out;
}

function reservas(def) {
  const out = {};
  for (const l of IDIOMAS) {
    out[l] = {};
    for (const { namespace, prefix } of def.sources) {
      Object.assign(out[l], achatar(MSG[l][namespace], prefix));
    }
  }
  return out;
}

const PERCENTUAIS = {};
for (const g of [...POWER_IDEAS, ...POWER_REFERENCE, ...FORCED_CHOICE]) {
  for (const b of g.bars) PERCENTUAIS[`${b.labelKey}Pct`] = b.value;
}
for (const r of DECLARED_VS_LIVED) {
  PERCENTUAIS[`${r.declared.labelKey}Pct`] = r.declared.value;
  PERCENTUAIS[`${r.lived.labelKey}Pct`] = r.lived.value;
}

/** As fotos de reserva de cada galeria, lidas da própria página (a ordem e os
 *  alts de lá são a curadoria). */
const GALERIAS = {
  "confrariaPage.photos": () => {
    const src = readFileSync("src/app/(site)/[locale]/confraria/page.tsx", "utf8");
    return [...src.matchAll(/src: "([^"]+)",\s*altKey: "([^"]+)"/g)].map((m) => ({
      file: path.join("public", m[1]),
      altKey: m[2],
    }));
  },
};

// ------------------------------------------------------------ helpers
const chave = (i) => `k${String(i).padStart(2, "0")}`;
const vazio = (v) =>
  v == null ||
  (typeof v === "string" && !v.trim()) ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === "object" && !Array.isArray(v) && !Object.values(v).some((x) => typeof x === "string" && x.trim()));

async function ler(id) {
  const q = encodeURIComponent(`*[_id == "${id}"][0]`);
  const r = await fetch(`${API}/data/query/${DATASET}?query=${q}`, { headers: H });
  const j = await r.json();
  if (!r.ok) throw new Error(`não consegui ler ${id}: ${JSON.stringify(j).slice(0, 300)}`);
  return j.result ?? null;
}

async function subirImagem(file) {
  const r = await fetch(
    `${API}/assets/images/${DATASET}?filename=${encodeURIComponent(path.basename(file))}`,
    {
      method: "POST",
      headers: { ...H, "Content-Type": file.endsWith(".webp") ? "image/webp" : "image/jpeg" },
      body: readFileSync(file),
    },
  );
  const j = await r.json();
  if (!r.ok) throw new Error(`upload de ${file} falhou: ${JSON.stringify(j).slice(0, 300)}`);
  return j.document._id;
}

// ------------------------------------------------------------ por página
let totalNovos = 0;
const mutations = [];

for (const def of PAGE_DEFS) {
  const atual = await ler(def.type);
  const res = reservas(def);
  const set = {};
  const novos = [];
  let mantidos = 0;

  for (const g of def.groups) {
    for (const [nome, , kind = "s"] of g.fields) {
      const existente = atual?.[nome];

      // Lista já preenchida: só confere o _type dos itens.
      if ((kind === "ls" || kind === "lt") && Array.isArray(existente) && existente.length) {
        const tipo = kind === "lt" ? "localeText" : "localeString";
        if (existente.some((it) => it?._type !== tipo)) {
          set[nome] = existente.map((it) => ({ ...it, _type: tipo }));
          novos.push(`${nome} (tipo dos itens → ${tipo})`);
        } else mantidos++;
        continue;
      }
      if (!vazio(existente)) {
        mantidos++;
        continue;
      }

      if (kind === "s" || kind === "t") {
        const v = { _type: kind === "t" ? "localeText" : "localeString" };
        for (const l of IDIOMAS) if (typeof res[l][nome] === "string") v[l] = res[l][nome];
        if (v.pt) (set[nome] = v), novos.push(nome);
      } else if (kind === "str") {
        if (typeof res.pt[nome] === "string") (set[nome] = res.pt[nome]), novos.push(nome);
      } else if (kind === "ls" || kind === "lt") {
        const pt = res.pt[nome];
        if (!Array.isArray(pt)) continue;
        set[nome] = pt.map((_, i) => {
          const item = { _type: kind === "lt" ? "localeText" : "localeString", _key: chave(i) };
          for (const l of IDIOMAS) {
            const lista = res[l][nome];
            if (Array.isArray(lista) && typeof lista[i] === "string") item[l] = lista[i];
          }
          return item;
        });
        novos.push(`${nome}[${pt.length}]`);
      } else if (kind === "num") {
        if (typeof PERCENTUAIS[nome] === "number") (set[nome] = PERCENTUAIS[nome]), novos.push(nome);
      } else if (kind === "imgs") {
        const fonte = GALERIAS[`${def.type}.${nome}`];
        if (!fonte) continue;
        const fotos = fonte();
        if (!GRAVAR) {
          novos.push(`${nome}[${fotos.length} fotos a subir]`);
          continue;
        }
        const itens = [];
        for (const [i, f] of fotos.entries()) {
          const ref = await subirImagem(f.file);
          const alt = { _type: "localeString" };
          for (const l of IDIOMAS) {
            const a = res[l][f.altKey];
            if (typeof a === "string") alt[l] = a;
          }
          itens.push({ _type: "pagePhoto", _key: chave(i), asset: { _type: "reference", _ref: ref }, alt });
          console.log(`   ↑ ${path.basename(f.file)}`);
        }
        set[nome] = itens;
        novos.push(`${nome}[${itens.length} fotos]`);
      }
    }
  }

  console.log(`\n■ ${def.title} (${def.type}) — ${atual ? "existe" : "novo"}`);
  console.log(`  a preencher: ${novos.length}   mantidos: ${mantidos}`);
  for (const n of novos) console.log(`   + ${n}`);

  if (novos.length) {
    totalNovos += novos.length;
    mutations.push({ createIfNotExists: { _id: def.type, _type: def.type } });
    mutations.push({ patch: { id: def.type, set } });
  }
}

if (!GRAVAR) {
  console.log(`\n(simulação: ${totalNovos} campos. Rode com --gravar para valer.)`);
  process.exit(0);
}
if (!mutations.length) {
  console.log("\nnada a fazer.");
  process.exit(0);
}

// Patch (e não createOrReplace): o que foi mantido continua intacto.
const r = await fetch(`${API}/data/mutate/${DATASET}?returnIds=true`, {
  method: "POST",
  headers: { ...H, "Content-Type": "application/json" },
  body: JSON.stringify({ mutations }),
});
const j = await r.json();
if (!r.ok) {
  console.error("\n✗ falhou:", JSON.stringify(j).slice(0, 500));
  process.exit(1);
}
console.log(`\n✓ gravado: ${totalNovos} campos em ${mutations.length / 2} páginas`);
console.log("  painel: Conteúdo → Páginas do site");
