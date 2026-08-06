import { defineType, defineField, defineArrayMember } from "sanity";

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
    defineField({
      name: "gallery",
      title: "Galeria de fotos",
      type: "array",
      description:
        "Fotos que aparecem na seção “Galeria” da página Sobre. Enquanto estiver vazia, o site mostra placeholders nas cores da marca. Prefira fotos em pé (retrato) — elas são recortadas em 3:4.",
      options: { layout: "grid" },
      of: [
        defineArrayMember({
          type: "image",
          name: "galleryPhoto",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Descrição da imagem (acessibilidade / SEO)",
              type: "localeString",
            }),
            defineField({
              name: "caption",
              title: "Legenda (opcional)",
              type: "localeString",
            }),
          ],
        }),
      ],
    }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  preview: { prepare: () => ({ title: "Sobre Andrea" }) },
});
