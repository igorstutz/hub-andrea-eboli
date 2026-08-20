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
      name: "group",
      title: "Grupo",
      type: "string",
      description:
        "Onde o conceito aparece na página inicial: como dimensão da ECP ou como verbete do vocabulário Ser Poder.",
      options: {
        list: [
          { title: "Dimensão da ECP", value: "dimension" },
          { title: "Vocabulário Ser Poder", value: "vocabulary" },
        ],
        layout: "radio",
      },
      initialValue: "vocabulary",
    }),
    defineField({
      name: "order",
      title: "Ordem",
      type: "number",
      description:
        "Posição dentro do grupo (1, 2, 3…). Sem número, entra em ordem alfabética no fim.",
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
