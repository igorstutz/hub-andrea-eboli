/**
 * Empacota o serviço de ingestão (servidor-ingest/app.ts) num ÚNICO arquivo
 * Node, pronto para o "Setup Node.js App" do cPanel.
 *
 * Uso:   node build-api.mjs
 * Saída: dist-api/
 *          app.js           — o serviço inteiro, dependências incluídas
 *          package.json     — mínimo (main: app.js), sem dependências
 *          tmp/restart.txt  — o Passenger/LiteSpeed reinicia o app quando a
 *                             data deste arquivo muda; cada build grava uma
 *                             nova, então todo envio reinicia o serviço
 *
 * 🔴 POR QUE UM BUNDLE, E NÃO `npm install` NO SERVIDOR:
 * A conta de FTP do deploy é escopada e não tem SSH. Com tudo dentro de um
 * arquivo não há node_modules para instalar, nem versão de dependência para
 * divergir entre a máquina que builda e o servidor: o que passou no teste é
 * byte a byte o que roda lá. O esbuild resolve o alias `@/` pelo tsconfig.json.
 *
 * O bundle NÃO contém segredo nenhum: as chaves (ANTHROPIC_API_KEY etc.) são
 * definidas na tela do cPanel e chegam por process.env em tempo de execução.
 * A conferência no fim procura assinaturas de chave no arquivo gerado para
 * garantir que isso continua verdade.
 */
import { build } from "esbuild";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const OUT = "dist-api";
const ENTRY = "servidor-ingest/app.ts";
// Node mais antigo que o serviço aceita. O `fetch`, `Request`, `Response` e
// `FormData` globais (usados pelos handlers) existem a partir do 18.
const NODE_TARGET = "node18";

const buildStamp = new Date().toISOString();

console.log(`→ empacotando ${ENTRY} para ${OUT}/app.js (alvo ${NODE_TARGET})\n`);
rmSync(OUT, { recursive: true, force: true });
mkdirSync(path.join(OUT, "tmp"), { recursive: true });

await build({
  entryPoints: [ENTRY],
  outfile: path.join(OUT, "app.js"),
  bundle: true,
  platform: "node",
  target: NODE_TARGET,
  // CommonJS: o Passenger carrega o arquivo de inicialização com `require`.
  format: "cjs",
  tsconfig: "tsconfig.json",
  // Legível de propósito: quando algo falhar no servidor, o stack trace tem de
  // apontar para código que dê para ler. Tamanho não é problema aqui.
  minify: false,
  sourcemap: false,
  legalComments: "none",
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.INGEST_BUILD": JSON.stringify(buildStamp),
  },
  banner: {
    js: `// Gerado por build-api.mjs em ${buildStamp}. NÃO EDITAR: mude servidor-ingest/ e src/lib/ingest/ e rode o build de novo.`,
  },
  logLevel: "info",
});

writeFileSync(
  path.join(OUT, "package.json"),
  JSON.stringify(
    {
      name: "andrea-eboli-ingest",
      private: true,
      description: "Serviço de ingestão do hub (Importar de link). Gerado por build-api.mjs.",
      main: "app.js",
      engines: { node: ">=18" },
    },
    null,
    2,
  ) + "\n",
);

writeFileSync(
  path.join(OUT, "tmp", "restart.txt"),
  `${buildStamp}\n`,
);

// A pasta do app mora DENTRO de public_html (public_html/ingest-api), para
// ser publicada pela mesma conta de FTP do site, que é escopada em
// public_html — assim não é preciso criar conta nova nem secret novo. O
// Passenger lê os arquivos do disco, não por HTTP, então nada aqui precisa ser
// servido: este .htaccess nega qualquer acesso pela web à pasta (app.js, o
// arquivo de estado do deploy e o que mais o cPanel criar). O bundle não tem
// segredo, mas fechar a porta custa duas linhas.
writeFileSync(
  path.join(OUT, ".htaccess"),
  [
    "# Pasta do serviço de ingestão (app Node do cPanel). O Passenger lê daqui",
    "# pelo disco; por HTTP nada desta pasta deve ser servido.",
    "Require all denied",
    "",
  ].join("\n"),
);

// ------------------------------------------------------------------
// Conferência
// ------------------------------------------------------------------
const appJs = path.join(OUT, "app.js");
if (!existsSync(appJs)) {
  console.error(`\n✗ ${appJs} não foi gerado`);
  process.exit(1);
}
const code = readFileSync(appJs, "utf8");
const erros = [];

// 1. Nenhum pedaço do Next pode ter entrado: o serviço roda fora dele.
if (/require\(["']next[/"']/.test(code) || /from ["']next\//.test(code)) {
  erros.push("o bundle importa algo de `next/*` — o serviço não roda dentro do Next");
}

// 2. As rotas têm de estar lá.
for (const rota of ["/ingest/health", "/ingest/generate", "/ingest/youtube/inspect"]) {
  if (!code.includes(rota)) erros.push(`a rota ${rota} não aparece no bundle`);
}

// 3. Nenhuma chave gravada no arquivo. As assinaturas cobrem Anthropic, OpenAI
//    e tokens do Sanity. Se isto disparar, alguém escreveu um segredo no código.
for (const [nome, re] of [
  ["Anthropic", /sk-ant-[A-Za-z0-9_-]{10,}/],
  ["OpenAI", /sk-(?:proj-)?[A-Za-z0-9]{20,}/],
  ["Sanity", /\bsk[A-Za-z0-9]{60,}\b/],
]) {
  if (re.test(code)) erros.push(`há o que parece ser uma chave da ${nome} dentro do bundle`);
}

// 4. O .htaccess que fecha a pasta tem de ir junto.
if (!existsSync(path.join(OUT, ".htaccess"))) {
  erros.push("o .htaccess de bloqueio da pasta não foi gerado");
}

if (erros.length) {
  console.error("\n✗ o bundle saiu, mas não pode ser publicado:");
  for (const e of erros) console.error(`   · ${e}`);
  process.exit(1);
}

const kb = Math.round(statSync(appJs).size / 1024);
console.log(`\n✓ serviço pronto em ${OUT}/  ·  app.js com ${kb} KB  ·  build ${buildStamp}`);
console.log(`  testar local:  PORT=8787 node ${OUT}/app.js   →   curl localhost:8787/ingest/health`);
console.log("  publicar:      workflow “Deploy (andreaeboli.com)” → modo enviar-api");
