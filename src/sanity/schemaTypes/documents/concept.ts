import { defineType, defineField } from "sanity";

// Página-Conceito: o glossário proprietário (Ser Poder, AVC, ICA…).
export const concept = defineType({
  name: "concept",
  title: "Conceito",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Nome do conceito",
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
      name: "shortDefinition",
      title: "Definição curta (1 frase)",
      type: "localeText",
      description: "Uma frase clara e citável — otimizada para as IAs.",
    }),
    defineField({
      name: "fullDefinition",
      title: "Definição completa",
      type: "localeBlock",
    }),
    defineField({
      name: "relatedConcepts",
      title: "Conceitos relacionados",
      type: "array",
      of: [{ type: "reference", to: [{ type: "concept" }] }],
    }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  preview: { select: { title: "title.pt", subtitle: "slug.current" } },
});
