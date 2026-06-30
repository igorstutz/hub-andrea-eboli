import { defineType, defineField } from "sanity";

// Singleton: configurações globais (links sociais p/ sameAs, newsletter).
export const siteSettings = defineType({
  name: "siteSettings",
  title: "Configurações",
  type: "document",
  fields: [
    defineField({
      name: "socialLinks",
      title: "Links oficiais (sameAs)",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "platform", title: "Plataforma", type: "string" }),
            defineField({ name: "url", title: "URL", type: "url" }),
          ],
          preview: { select: { title: "platform", subtitle: "url" } },
        },
      ],
    }),
    defineField({
      name: "newsletterTitle",
      title: "Título da newsletter",
      type: "localeString",
    }),
    defineField({
      name: "newsletterText",
      title: "Texto da newsletter",
      type: "localeText",
    }),
  ],
  preview: { prepare: () => ({ title: "Configurações" }) },
});
