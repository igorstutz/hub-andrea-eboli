import { defineType, defineField } from "sanity";

// Campos de SEO por página.
export const seo = defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: "metaTitle",
      title: "Meta title (PT/EN)",
      type: "localeString",
    }),
    defineField({
      name: "metaDescription",
      title: "Meta description (PT/EN)",
      type: "localeText",
    }),
    defineField({
      name: "ogImage",
      title: "Imagem de compartilhamento (Open Graph)",
      type: "image",
    }),
  ],
});
