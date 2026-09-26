import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { BarChartIcon, LinkIcon } from "@sanity/icons";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { schema } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";
import IngestTool from "./src/sanity/tools/IngestTool";
import DashboardTool from "./src/sanity/tools/DashboardTool";

/**
 * A ferramenta "Importar de link" só existe onde há um serviço de ingestão
 * para atendê-la.
 *
 * Ela chama /api/ingest/*. Esse serviço existe em DOIS lugares:
 *   1. no `npm run dev`, como rotas do Next (Studio embutido em localhost);
 *   2. no painel publicado em andreaeboli.com/admin, como o serviço Node do
 *      cPanel montado em andreaeboli.com/api (servidor-ingest/ → dist-api/).
 *      O `build-painel.mjs` declara isso gravando SANITY_STUDIO_INGEST_API_URL
 *      no bundle — só as variáveis com esse prefixo passam pelo Vite da Sanity.
 *
 * Por isso a regra é positiva ("onde declararam um serviço") e não uma lista
 * de exclusões: um destino novo — o Studio de reserva em
 * andreaeboli.sanity.studio, por exemplo — nasce SEM a ferramenta, que é o
 * lado seguro do erro. Sem isto o botão apareceria lá, chamaria uma rota que
 * não existe e a Andrea não teria como saber o motivo. Se um dia o reserva
 * precisar da ferramenta: `npx sanity deploy` com
 * SANITY_STUDIO_INGEST_API_URL=https://andreaeboli.com/api (a origem dele já
 * está na lista de CORS do serviço).
 *
 * A checagem é feita dentro do callback de `tools`, que a Sanity executa no
 * navegador na inicialização do Studio, e não no escopo do módulo: assim não
 * há divergência entre servidor e cliente no Studio embutido.
 */
function temServicoDeIngestao(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.SANITY_STUDIO_INGEST_API_URL) return true;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

export default defineConfig({
  /**
   * O caminho do painel — /admin no `npm run dev` e no ar.
   *
   * 🔴 POR QUE ISTO É CONDICIONAL, e não `basePath: "/admin"` direto:
   * quem monta o caminho final é `joinBasePath(rootPath, config.basePath)`,
   * dentro do `sanity`. No painel publicado o `rootPath` já é "/admin" (vem do
   * `SANITY_STUDIO_BASEPATH` que o `build-painel.mjs` define, porque o
   * `sanity build` NÃO lê esta chave), então declarar "/admin" aqui também
   * fazia a URL virar `/admin/admin` depois do login. No Studio embutido no
   * Next não há `rootPath`, e sem esta chave o painel cairia na raiz do site.
   *
   * A variável só existe no bundle do `sanity build` — o Vite a injeta lá e
   * ela é `undefined` no build do Next. É o que separa os dois casos.
   */
  basePath: process.env.SANITY_STUDIO_BASEPATH ? undefined : "/admin",
  projectId,
  dataset,
  schema,
  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  tools: (prev) =>
    temServicoDeIngestao()
      ? [
          {
            name: "link-ingest",
            title: "Importar de link",
            icon: LinkIcon,
            component: IngestTool,
          },
          // "Acessos" usa o mesmo serviço (andreaeboli.com/api/track), então
          // aparece onde a importação aparece. Ver src/lib/analytics/track.ts.
          {
            name: "acessos",
            title: "Acessos",
            icon: BarChartIcon,
            component: DashboardTool,
          },
          ...prev,
        ]
      : prev,
});
