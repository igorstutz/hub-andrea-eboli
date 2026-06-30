import { defineType, defineField } from "sanity";

// Tema / cluster que agrupa perguntas (Identidade, Validação, Liderança…).
export const topic = defineType({
  name: "topic",
  title: "Tema",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Nome",
      type: "localeString",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: (doc) => (doc as { title?: { pt?: string } }).title?.pt ?? "", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: "description", title: "Descrição", type: "localeText" }),
  ],
  preview: { select: { title: "title.pt", subtitle: "slug.current" } },
});
