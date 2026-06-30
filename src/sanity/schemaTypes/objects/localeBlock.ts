import { defineType, defineField } from "sanity";

// Conteúdo rico (Portable Text) bilíngue (PT/EN).
export const localeBlock = defineType({
  name: "localeBlock",
  title: "Conteúdo (PT/EN)",
  type: "object",
  fields: [
    defineField({
      name: "pt",
      title: "Português",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "en",
      title: "English",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "es",
      title: "Español",
      type: "array",
      of: [{ type: "block" }],
    }),
  ],
});
