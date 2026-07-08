import { defineType, defineField } from "sanity";

// Página-Pergunta: a unidade principal do hub.
export const question = defineType({
  name: "question",
  title: "Pergunta",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Pergunta",
      type: "localeString",
      description: "A pergunta humana — vira o título (H1) e a URL.",
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
      name: "topic",
      title: "Tema",
      type: "reference",
      to: [{ type: "topic" }],
    }),
    defineField({
      name: "experience",
      title: "Abertura — a experiência",
      type: "localeText",
      description: "Como a dor é vivida. Cria identificação e captura buscas pela experiência.",
    }),
    defineField({
      name: "answer",
      title: "Resposta direta",
      type: "localeText",
      description: "A resposta objetiva, logo no início — é o trecho que as IAs citam.",
    }),
    defineField({ name: "body", title: "Corpo", type: "localeBlock" }),
    defineField({
      name: "relatedConcepts",
      title: "Conceitos relacionados",
      type: "array",
      of: [{ type: "reference", to: [{ type: "concept" }] }],
      description: "Todo conteúdo do hub deve estar ligado a pelo menos um conceito.",
      validation: (r) => r.min(1).warning("Vincule esta pergunta a pelo menos um conceito."),
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
