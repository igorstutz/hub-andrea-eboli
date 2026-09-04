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
   * É o painel que a ANDREA usa. Existe porque o site é um export estático:
   * o workflow de deploy apaga `src/app/(studio)` antes de buildar, então
   * `/studio` não existe em andreaeboli.com nem existiria em hospedagem
   * estática nenhuma. O Studio embutido continua valendo no `npm run dev`.
   *
   * Publicar/atualizar: `npx sanity deploy`. Sem esta chave o comando pergunta
   * o hostname interativamente a cada vez.
   *
   * ⚠️ Depois de qualquer mudança de schema em `src/sanity/schemaTypes`, é
   * preciso rodar `npx sanity deploy` de novo — senão o painel dela continua
   * com os campos antigos.
   */
  studioHost: "andreaeboli",

  /** Fixa a aplicação criada no primeiro deploy, senão o CLI pergunta o id a
   *  cada `sanity deploy`. */
  deployment: {
    appId: "i3toatvg5g5vt5r9wvqhatlj",
  },
});
