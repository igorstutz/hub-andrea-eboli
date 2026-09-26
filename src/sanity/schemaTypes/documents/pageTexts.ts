import { defineType, defineField, defineArrayMember } from "sanity";
import type { FieldDefinition } from "sanity";
import { PAGE_DEFS, type FieldDef, type PageDef } from "../../pageTextDefs";

/**
 * As páginas fixas do site, editáveis no painel.
 *
 * Os campos NÃO são escritos aqui: saem de `src/sanity/pageTextDefs.ts`, que é
 * a lista única (a mesma que o `semeia-textos-paginas.mjs` usa). Para pôr um
 * texto novo no painel: acrescentar a linha lá e usar `tx("chave")` na página.
 *
 * 📌 TODO CAMPO É OPCIONAL, DE PROPÓSITO. Vazio = a página usa o texto do
 * arquivo de tradução (ver `src/lib/pageText.ts`). Nada quebra se alguém limpar
 * um campo, e o site continua montável com o dataset fora do ar.
 */

function field([name, title, kind = "s", description]: FieldDef, group: string): FieldDefinition {
  const base = { name, title, description, group };
  switch (kind) {
    case "s":
      return defineField({ ...base, type: "localeString" });
    case "t":
      return defineField({ ...base, type: "localeText" });
    case "str":
      return defineField({ ...base, type: "string" });
    case "ls":
      return defineField({ ...base, type: "array", of: [{ type: "localeString" }] });
    case "lt":
      return defineField({ ...base, type: "array", of: [{ type: "localeText" }] });
    case "url":
      return defineField({
        ...base,
        type: "url",
        validation: (r) => r.uri({ scheme: ["http", "https"] }),
      });
    case "num":
      return defineField({
        ...base,
        type: "number",
        validation: (r) => r.min(0).max(100),
      });
    case "img":
      return defineField({ ...base, type: "image", options: { hotspot: true } });
    case "imgs":
      return defineField({
        ...base,
        type: "array",
        options: { layout: "grid" },
        of: [
          defineArrayMember({
            type: "image",
            name: "pagePhoto",
            fields: [
              defineField({
                name: "alt",
                title: "Descrição da imagem (acessibilidade e Google)",
                description: "Descreva o que se VÊ na foto.",
                type: "localeString",
              }),
            ],
          }),
        ],
      });
  }
}

/** Campos que existem num documento além dos gerados (a galeria do Sobre, com
 *  legenda, é anterior a este arquivo e tem dados no ar). */
const EXTRA_FIELDS: Record<string, FieldDefinition[]> = {
  aboutPage: [
    defineField({
      name: "gallery",
      title: "Galeria de fotos",
      group: "galeria",
      type: "array",
      description:
        "Fotos da seção “Galeria” da página Sobre, em mosaico: cada foto aparece inteira, na proporção original. O mosaico é lido por colunas.",
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
  ],
};

function pageType(def: PageDef) {
  return defineType({
    name: def.type,
    title: def.title,
    type: "document",
    groups: def.groups.map((g, i) => ({
      name: g.name,
      title: g.title,
      default: i === 0,
    })),
    fields: [
      ...def.groups.flatMap((g) => g.fields.map((f) => field(f, g.name))),
      ...(EXTRA_FIELDS[def.type] ?? []),
    ],
    preview: { prepare: () => ({ title: def.title, subtitle: def.subtitle }) },
  });
}

export const pageTextTypes = PAGE_DEFS.map(pageType);

/** Os ids dos singletons, na ordem do painel. */
export const PAGE_TYPES = PAGE_DEFS.map((d) => ({ type: d.type, title: d.title }));
