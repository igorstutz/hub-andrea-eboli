import { defineType, defineField } from "sanity";

// Singleton: a página de autoridade (Sobre Andrea).
export const aboutPage = defineType({
  name: "aboutPage",
  title: "Sobre Andrea",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Nome",
      type: "string",
      initialValue: "Andrea Eboli",
    }),
    defineField({ name: "headline", title: "Chamada", type: "localeString" }),
    defineField({ name: "bio", title: "Biografia", type: "localeBlock" }),
    defineField({
      name: "credentials",
      title: "Credenciais",
      type: "array",
      of: [{ type: "localeString" }],
      description: "Forbes, TED, doutorado, ESPM, livro, podcast…",
    }),
    defineField({ name: "photo", title: "Foto", type: "image" }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  preview: { prepare: () => ({ title: "Sobre Andrea" }) },
});
