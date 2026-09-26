import type { StructureResolver } from "sanity/structure";
import { DocumentsIcon } from "@sanity/icons";
import { PAGE_TYPES } from "./schemaTypes/documents/pageTexts";

// Estrutura do Studio: as páginas fixas numa pasta só, configurações, e as
// bibliotecas listadas abaixo.
//
// "Páginas do site" (25/09/2026): cada página fixa é um documento único cujo
// id é o próprio tipo (homePage, aboutPage…). A lista sai de pageTextDefs.ts,
// então uma página nova no arquivo aparece aqui sem mexer neste código.
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Conteúdo")
    .items([
      S.listItem()
        .title("Páginas do site")
        .id("paginas")
        .icon(DocumentsIcon)
        .child(
          S.list()
            .title("Páginas do site")
            .items(
              PAGE_TYPES.map(({ type, title }) =>
                S.listItem()
                  .title(title)
                  .id(type)
                  .child(S.document().schemaType(type).documentId(type)),
              ),
            ),
        ),
      S.listItem()
        .title("Configurações")
        .id("siteSettings")
        .child(
          S.document().schemaType("siteSettings").documentId("siteSettings"),
        ),
      S.listItem()
        .title("⚙️ Agentes de IA")
        .id("aiSettings")
        .child(S.document().schemaType("aiSettings").documentId("aiSettings")),
      S.divider(),
      S.documentTypeListItem("question").title("Perguntas"),
      S.documentTypeListItem("concept").title("Conceitos"),
      S.documentTypeListItem("caseStudy").title("Casos e Personagens"),
      S.documentTypeListItem("article").title("Artigos"),
      S.documentTypeListItem("video").title("Vídeos"),
      S.documentTypeListItem("mediaMention").title("Na mídia (menções)"),
      S.divider(),
      S.documentTypeListItem("topic").title("Temas"),
    ]);
