/**
 * Builda o painel (Sanity Studio) que a Andrea usa em
 * https://andreaeboli.com/admin.
 *
 * O Studio é uma SPA: um index.html e um monte de JS com hash no nome. Não
 * precisa de servidor Node — por isso ele cabe na mesma hospedagem estática do
 * site, e não há motivo para o painel morar em outro domínio.
 *
 * Uso: node build-painel.mjs
 * Saída: dist-painel/  (o modo `enviar-painel` do workflow publica em /admin)
 *
 * 🔴 SEMPRE POR AQUI, nunca `npx sanity build` na mão. O `sanity build` NÃO lê
 * o `basePath` do sanity.config.ts (isso vale só para o Studio embutido no
 * Next): ele resolve o caminho por `SANITY_STUDIO_BASEPATH` ou por
 * `project.basePath` do sanity.cli.ts — ver `determineBasePath` em
 * @sanity/cli. Sem a variável, o build sai apontando para /static/... e o
 * painel abre em tela branca com 404 em tudo.
 *
 * ⚠️ Rodar de novo depois de QUALQUER mudança em src/sanity/schemaTypes —
 * senão o painel dela continua com os campos antigos.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { readdirSync } from "node:fs";
import path from "node:path";

const BASE_PATH = "/admin";
const OUT = "dist-painel";

// A identidade do projeto, para a conferência do fim. Tem de bater com
// src/sanity/env.ts.
const PROJECT_ID = "52ssivbg";

console.log(`→ buildando o painel com base path ${BASE_PATH}\n`);

rmSync(OUT, { recursive: true, force: true });

// `shell: true` é obrigatório no Windows: desde o Node 20 o spawn recusa
// executar .cmd (e o npx é um .cmd) sem shell, e a falha vem MUDA — status
// diferente de zero e nenhuma linha de erro.
//
// O painel fica na versão testada aqui: o `autoUpdates: false` do
// sanity.cli.ts impede que o bundle passe a ser puxado do CDN da Sanity em
// tempo de execução, com a versão do Studio mudando sozinha.
// Comando em UMA string, e não em array: com `shell: true` o Node avisa
// (DEP0190) que argumentos em array não são escapados. Aqui não há entrada de
// fora — o comando é constante.
const r = spawnSync(`npx sanity build ${OUT} --yes`, {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, SANITY_STUDIO_BASEPATH: BASE_PATH },
});

if (r.status !== 0) {
  console.error("\n✗ o build do Studio falhou");
  process.exit(r.status ?? 1);
}

// ------------------------------------------------------------------
// Conferência — as duas falhas que passam pelo build sem reclamar
// ------------------------------------------------------------------
const index = path.join(OUT, "index.html");
if (!existsSync(index)) {
  console.error(`\n✗ ${index} não foi gerado`);
  process.exit(1);
}

const html = readFileSync(index, "utf8");
const erros = [];

// 1. O base path. Se sair "/static/" o painel busca os arquivos na raiz do
//    domínio, onde mora o SITE, e recebe 404 (ou pior, o HTML do site).
if (!html.includes(`${BASE_PATH}/static/`)) {
  erros.push(
    `o index.html não aponta para ${BASE_PATH}/static/ — o SANITY_STUDIO_BASEPATH não pegou`,
  );
}

// 2. A identidade do projeto dentro do bundle. O Vite da Sanity só injeta
//    variáveis com prefixo SANITY_STUDIO_ e troca `process.env` por `{}`, então
//    ler NEXT_PUBLIC_* aqui devolve undefined. Foi assim que o painel hospedado
//    quebrou uma vez, com build verde: abria e morria em "Variável de ambiente
//    ausente". src/sanity/env.ts tem os valores fixos justamente por isso.
const bundles = readdirSync(path.join(OUT, "static")).filter((f) =>
  f.endsWith(".js"),
);
const temProjectId = bundles.some((f) =>
  readFileSync(path.join(OUT, "static", f), "utf8").includes(PROJECT_ID),
);
if (!temProjectId) {
  erros.push(
    `o projectId ${PROJECT_ID} não aparece em nenhum bundle — o painel vai abrir em erro de configuração`,
  );
}

if (erros.length) {
  console.error("\n✗ o build saiu, mas o painel não funcionaria:");
  for (const e of erros) console.error(`   · ${e}`);
  process.exit(1);
}

console.log(
  `\n✓ painel pronto em ${OUT}/  ·  base path ${BASE_PATH}  ·  ${bundles.length} bundles`,
);
console.log(
  "  publicar: workflow \u201cDeploy (andreaeboli.com)\u201d \u2192 modo enviar-painel",
);
