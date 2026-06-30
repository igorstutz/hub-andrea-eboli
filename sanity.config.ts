import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { PlayIcon } from "@sanity/icons";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { schema } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";
import YouTubeIngestTool from "./src/sanity/tools/YouTubeIngestTool";

export default defineConfig({
  basePath: "/studio",
  projectId,
  dataset,
  schema,
  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  tools: (prev) => [
    {
      name: "youtube-ingest",
      title: "Importar do YouTube",
      icon: PlayIcon,
      component: YouTubeIngestTool,
    },
    ...prev,
  ],
});
