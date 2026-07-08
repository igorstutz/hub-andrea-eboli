import { defineType, defineField, defineArrayMember } from "sanity";

// Página-Vídeo: embed + transcrição + resumo (ouro para GEO).
export const video = defineType({
  name: "video",
  title: "Vídeo",
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
      name: "youtubeUrl",
      title: "URL do YouTube",
      type: "url",
    }),
    defineField({
      name: "publishedAt",
      title: "Data de publicação",
      type: "datetime",
    }),
    defineField({
      name: "durationSeconds",
      title: "Duração (segundos)",
      type: "number",
      description: "Preenchido automaticamente na importação.",
    }),
    defineField({
      name: "directAnswer",
      title: "Resposta direta (citável)",
      type: "localeText",
      description:
        "1–2 frases autossuficientes — é o trecho destacado e o que as IAs citam.",
    }),
    defineField({ name: "summary", title: "Resumo", type: "localeText" }),
    defineField({
      name: "keyTakeaways",
      title: "Principais aprendizados",
      type: "localeBlock",
    }),
    defineField({
      name: "chapters",
      title: "Capítulos / momentos-chave",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "chapter",
          fields: [
            defineField({
              name: "startTime",
              title: "Início (segundos)",
              type: "number",
              validation: (r) => r.required().min(0),
            }),
            defineField({
              name: "title",
              title: "Título do capítulo",
              type: "string",
              validation: (r) => r.required(),
            }),
          ],
          preview: {
            select: { title: "title", subtitle: "startTime" },
            prepare({ title, subtitle }) {
              const s = Number(subtitle) || 0;
              const mm = Math.floor(s / 60);
              const ss = String(s % 60).padStart(2, "0");
              return { title, subtitle: `${mm}:${ss}` };
            },
          },
        }),
      ],
    }),
    defineField({ name: "transcript", title: "Transcrição", type: "localeBlock" }),
    defineField({
      name: "topic",
      title: "Tema",
      type: "reference",
      to: [{ type: "topic" }],
    }),
    defineField({
      name: "relatedQuestions",
      title: "Perguntas relacionadas",
      type: "array",
      of: [{ type: "reference", to: [{ type: "question" }] }],
    }),
    defineField({
      name: "relatedConcepts",
      title: "Conceitos relacionados",
      type: "array",
      of: [{ type: "reference", to: [{ type: "concept" }] }],
      description: "Todo conteúdo do hub deve estar ligado a pelo menos um conceito.",
      validation: (r) => r.min(1).warning("Vincule este vídeo a pelo menos um conceito."),
    }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  preview: { select: { title: "title.pt", subtitle: "slug.current" } },
});
