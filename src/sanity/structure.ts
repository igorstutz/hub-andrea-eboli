import type { StructureResolver } from "sanity/structure";

// Estrutura do Studio: singletons no topo, bibliotecas listadas abaixo.
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Conteúdo")
    .items([
      S.listItem()
        .title("Sobre Andrea")
        .id("aboutPage")
        .child(S.document().schemaType("aboutPage").documentId("aboutPage")),
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
      S.divider(),
      S.documentTypeListItem("topic").title("Temas"),
    ]);
