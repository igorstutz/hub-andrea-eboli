import { defineType, defineField } from "sanity";

// Página-Caso: personagens e padrões de comportamento.
export const caseStudy = defineType({
  name: "caseStudy",
  title: "Caso / Personagem",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Personagem / caso",
      type: "localeString",
      description: 'Ex.: "O chefe que nunca reconhece ninguém".',
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      options: { source: (doc) => (doc as { title?: { pt?: string } }).title?.pt ?? "", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: "description", title: "Descrição", type: "localeText" }),
    defineField({
      name: "pattern",
      title: "O padrão de comportamento",
      type: "localeBlock",
    }),
    defineField({
      name: "relatedQuestions",
      title: "Perguntas relacionadas",
      type: "array",
      of: [{ type: "reference", to: [{ type: "question" }] }],
    }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  preview: { select: { title: "title.pt", subtitle: "slug.current" } },
});
