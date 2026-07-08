import { defineType, defineField } from "sanity";

// Página-Artigo / Pesquisa: white papers, estudos, artigos.
export const article = defineType({
  name: "article",
  title: "Pesquisa / Artigo",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Título",
      type: "localeString",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      options: { source: (doc) => (doc as { title?: { pt?: string } }).title?.pt ?? "", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "kind",
      title: "Tipo",
      type: "string",
      options: {
        list: [
          { title: "Artigo", value: "article" },
          { title: "White paper", value: "whitepaper" },
          { title: "Estudo", value: "study" },
        ],
        layout: "radio",
      },
      initialValue: "article",
    }),
    defineField({ name: "excerpt", title: "Resumo", type: "localeText" }),
    defineField({ name: "body", title: "Corpo", type: "localeBlock" }),
    defineField({
      name: "pdf",
      title: "Arquivo (PDF)",
      type: "file",
      options: { accept: ".pdf" },
    }),
    defineField({
      name: "publishedAt",
      title: "Data de publicação",
      type: "datetime",
    }),
    defineField({
      name: "relatedConcepts",
      title: "Conceitos relacionados",
      type: "array",
      of: [{ type: "reference", to: [{ type: "concept" }] }],
      description: "Todo conteúdo do hub deve estar ligado a pelo menos um conceito.",
      validation: (r) => r.min(1).warning("Vincule este artigo a pelo menos um conceito."),
    }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  preview: { select: { title: "title.pt", subtitle: "kind" } },
});
