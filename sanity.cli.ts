import path from "node:path";
import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: "52ssivbg",
    dataset: "production",
  },

  /**
   * O alias `@/` do projeto, ensinado ao Vite.
   *
   * O `npm run dev` e o build do Next resolvem `@/` pelo `paths` do
   * tsconfig.json, mas o `sanity deploy` builda com Vite, que não lê aquele
   * campo. Sem isto o deploy falha em `IngestTool.tsx`, que importa
   * `@/lib/ingest/sources`:
   *   "[vite]: Rollup failed to resolve import @/lib/ingest/sources"
   *
   * Resolver o alias aqui (em vez de trocar aquele import por caminho
   * relativo) mantém a convenção do projeto e evita que o próximo `@/` que
   * alguém escrever dentro de src/sanity volte a quebrar o deploy.
   */
  vite: (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        // O CLI da Sanity roda a partir da raiz do projeto.
        "@": path.resolve(process.cwd(), "src"),
      },
    },
  }),

  /**
   * Endereço do Studio hospedado pela Sanity: https://andreaeboli.sanity.studio
   *
   * ⚠️ HOJE ISTO É RESERVA, NÃO O PAINEL PRINCIPAL. O painel da Andrea é
   * https://andreaeboli.com/admin — o mesmo Studio, buildado por
   * `build-painel.mjs` e publicado junto com o site (ver o modo
   * `enviar-painel` no workflow de deploy). Ter os dois custa pouco e o
   * hospedado serve de porta dos fundos se o domínio sair do ar.
   *
   * Publicar/atualizar o hospedado: `npx sanity deploy`. Sem esta chave o
   * comando pergunta o hostname interativamente a cada vez.
   *
   * ⚠️ Depois de qualquer mudança de schema em `src/sanity/schemaTypes` os
   * DOIS ficam desatualizados: rodar `node build-painel.mjs` + o modo
   * `enviar-painel` (o de andreaeboli.com) e `npx sanity deploy` (o de
   * reserva). Senão o painel continua com os campos antigos.
   *
   * ⚠️ NÃO ACRESCENTAR `project: { basePath: "/admin" }` AQUI. O
   * `determineBasePath` do @sanity/cli lê esta chave tanto no `sanity build`
   * quanto no `sanity deploy`, e o Studio hospedado é servido na RAIZ de
   * andreaeboli.sanity.studio: com um basePath configurado ele passaria a
   * pedir /admin/static/... e quebraria. O base path do painel de
   * andreaeboli.com entra pela variável SANITY_STUDIO_BASEPATH, que só o
   * `build-painel.mjs` define.
   */
  studioHost: "andreaeboli",

  deployment: {
    /** Fixa a aplicação criada no primeiro deploy, senão o CLI pergunta o id a
     *  cada `sanity deploy`. */
    appId: "i3toatvg5g5vt5r9wvqhatlj",

    /**
     * O painel fica na versão do Studio que foi buildada e testada aqui.
     *
     * Com auto updates ligado, o bundle é puxado do CDN da Sanity em tempo de
     * execução e a versão do Studio muda sozinha — inclusive no painel que a
     * Andrea usa todo dia, sem ninguém ter aberto para conferir. Como o painel
     * é publicado por nós (`node build-painel.mjs`), atualizar é subir de
     * versão o pacote `sanity` e buildar de novo.
     */
    autoUpdates: false,
  },
});
