import { defineType, defineField } from "sanity";

/**
 * Uma aparição da Andrea na mídia que NÃO é um artigo dela no hub: pesquisa
 * que a cita, matéria em que foi mencionada, entrevista, podcast, palestra.
 *
 * 📌 POR QUE UM TIPO À PARTE (26/09/2026): até aqui a página Na mídia listava
 * todo artigo importado da Forbes/LinkedIn, sem escolha, e não havia como pôr
 * na lista algo que não fosse artigo dela. Agora a lista junta duas fontes:
 *   · artigos com "Aparecer em Na mídia" ligado (campo `showInMedia`);
 *   · os documentos deste tipo.
 * Uma menção não vira página própria no site: o título leva direto ao
 * original, no veículo.
 */
export const mediaMention = defineType({
  name: "mediaMention",
  title: "Na mídia (menção)",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Título",
      description: "O título da matéria, pesquisa ou episódio, como está no original.",
      type: "localeString",
      validation: (r) =>
        r.custom((v?: { pt?: string }) => (v?.pt?.trim() ? true : "Preencha pelo menos o título em Português.")),
    }),
    defineField({
      name: "outlet",
      title: "Veículo",
      description: "Onde saiu: Exame, Valor, Forbes, nome do podcast, instituto da pesquisa…",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "kind",
      title: "Tipo",
      type: "string",
      options: {
        list: [
          { title: "Menção em matéria", value: "mention" },
          { title: "Pesquisa ou estudo que a cita", value: "research" },
          { title: "Entrevista", value: "interview" },
          { title: "Podcast ou vídeo", value: "podcast" },
          { title: "Palestra ou evento", value: "talk" },
          { title: "Artigo em outro veículo", value: "article" },
        ],
        layout: "radio",
      },
      initialValue: "mention",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "url",
      title: "Link do original",
      type: "url",
      validation: (r) => r.required().uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "date",
      title: "Data da publicação",
      description: "A data em que saiu no veículo. Aparece na lista e define a ordem (mais recente primeiro).",
      type: "date",
      options: { dateFormat: "DD/MM/YYYY" },
    }),
    defineField({
      name: "excerpt",
      title: "Resumo (opcional)",
      description: "Uma ou duas frases sobre o que o material diz dela.",
      type: "localeText",
    }),
  ],
  orderings: [{ title: "Data (mais recente)", name: "dateDesc", by: [{ field: "date", direction: "desc" }] }],
  preview: {
    select: { title: "title.pt", outlet: "outlet", date: "date" },
    prepare: ({ title, outlet, date }) => ({
      title: title || "(sem título)",
      subtitle: [outlet, date ? date.split("-").reverse().join("/") : null].filter(Boolean).join(" · "),
    }),
  },
});
