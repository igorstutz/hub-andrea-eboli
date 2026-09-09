import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { LinkIcon } from "@sanity/icons";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { schema } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";
import IngestTool from "./src/sanity/tools/IngestTool";

/**
 * A ferramenta "Importar de link" só existe onde as rotas de API existem.
 *
 * Ela chama `/api/ingest/generate` e `/api/ingest/youtube/transcribe`, que são
 * rotas do Next e só respondem no `npm run dev`. Nos outros dois lugares onde
 * este mesmo config roda — o painel estático em andreaeboli.com/admin e o
 * Studio hospedado pela Sanity — não há servidor Node, então o botão
 * apareceria e falharia. Pior ainda para a Andrea, que é quem usa o painel e
 * não teria como saber o motivo.
 *
 * Por isso a regra é positiva ("só no dev") e não uma lista de exclusões: um
 * destino novo nasce sem a ferramenta, que é o lado seguro do erro.
 *
 * A checagem é feita aqui dentro do callback de `tools`, que a Sanity executa
 * no navegador na inicialização do Studio, e não no escopo do módulo: assim
 * não há divergência entre servidor e cliente no Studio embutido.
 */
function ehStudioEmbutidoLocal(): boolean {
  if (typeof window === "undefined") return false;
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
    ehStudioEmbutidoLocal()
      ? [
          {
            name: "link-ingest",
            title: "Importar de link",
            icon: LinkIcon,
            component: IngestTool,
          },
          ...prev,
        ]
      : prev,
});
