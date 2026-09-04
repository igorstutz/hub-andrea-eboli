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
 * rotas do Next e vivem apenas no Studio embutido no site (`npm run dev`). No
 * Studio hospedado pela Sanity (`*.sanity.studio`) a origem é outra e essas
 * rotas não existem, então o botão apareceria e falharia — pior ainda para a
 * Andrea, que é quem usa esse Studio e não tem como saber o motivo.
 *
 * A checagem é feita aqui dentro do callback de `tools`, que a Sanity executa
 * no navegador na inicialização do Studio, e não no escopo do módulo: assim
 * não há divergência entre servidor e cliente no Studio embutido.
 */
function ehStudioHospedado(): boolean {
  return (
    typeof window !== "undefined" &&
    window.location.hostname.endsWith(".sanity.studio")
  );
}

export default defineConfig({
  basePath: "/studio",
  projectId,
  dataset,
  schema,
  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  tools: (prev) =>
    ehStudioHospedado()
      ? prev
      : [
          {
            name: "link-ingest",
            title: "Importar de link",
            icon: LinkIcon,
            component: IngestTool,
          },
          ...prev,
        ],
});
