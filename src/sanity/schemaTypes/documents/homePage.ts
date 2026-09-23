import { defineType, defineField } from "sanity";

/**
 * Textos da página inicial — editáveis pela Andrea no painel.
 *
 * 🔴 POR QUE ISTO EXISTE (22/09/2026): estes textos nasceram nos arquivos de
 * tradução (`messages/pt.json`, `en.json`, `es.json`) e só mudavam por commit.
 * O Igor: "eu queria mudar as perguntas da pagina principal e as 3 do
 * quadrado... mas nao estou as encontrando no admin". Estavam no código, e o
 * painel só mostra o que é documento do Sanity.
 *
 * 📌 TODO CAMPO É OPCIONAL, DE PROPÓSITO. Campo vazio aqui = a página usa o
 * texto do arquivo de tradução (ver `src/lib/homeText.ts`). Três consequências
 * boas: nada quebra se alguém limpar um campo, a tradução continua sendo a
 * rede de proteção, e não é preciso migrar tudo de uma vez.
 *
 * 📌 OS NOMES DOS CAMPOS SÃO OS MESMOS DAS CHAVES DE TRADUÇÃO (`thesisP1`,
 * `q1`, `audienceDenial`…). Não renomear: é essa igualdade que deixa o
 * fallback ser uma linha em vez de um mapa de-para.
 *
 * ⚠️ As três perguntas (`q1`, `q2`, `q3`) alimentam a home E o quadro da
 * página Sobre. Antes o texto estava duplicado em dois namespaces e mudar um
 * não mudava o outro. Agora é um lugar só.
 */

// Ajuda repetida em todo campo de lista: a ordem é a ordem de exibição.
const LISTA = "Cada item é uma linha. Arraste para reordenar.";

export const homePage = defineType({
  name: "homePage",
  title: "Página inicial",
  type: "document",
  groups: [
    { name: "topo", title: "Topo", default: true },
    { name: "audiencia", title: "Para quem é" },
    { name: "tese", title: "A tese" },
    { name: "perguntas", title: "As 3 perguntas" },
    { name: "ecp", title: "A ECP" },
    { name: "secoes", title: "Seções" },
    { name: "newsletter", title: "Newsletter" },
  ],
  fields: [
    // ---------------------------------------------------------------- topo
    defineField({
      name: "rotatingLabel",
      title: "Chamada acima das perguntas que giram",
      description: 'Hoje: "Você já se perguntou…"',
      type: "localeString",
      group: "topo",
    }),
    defineField({
      name: "rotatingQuestions",
      title: "Perguntas que giram no topo",
      description: `As perguntas curtas que se alternam no alto da página. ${LISTA}`,
      type: "array",
      of: [{ type: "localeString" }],
      group: "topo",
    }),
    defineField({
      name: "answerLabel",
      title: "Frase de virada",
      description: 'Hoje: "Existe um nome para tudo isso"',
      type: "localeString",
      group: "topo",
    }),
    defineField({
      name: "title",
      title: "Título principal",
      description: 'Hoje: "Ser Poder"',
      type: "localeString",
      group: "topo",
    }),
    defineField({
      name: "leadStrong",
      title: "Primeira linha em destaque",
      type: "localeText",
      group: "topo",
    }),
    defineField({
      name: "lead",
      title: "Parágrafo de abertura",
      type: "localeText",
      group: "topo",
    }),
    defineField({
      name: "ctaPrimary",
      title: "Botão principal",
      type: "localeString",
      group: "topo",
    }),
    defineField({
      name: "ctaSecondary",
      title: "Botão secundário",
      type: "localeString",
      group: "topo",
    }),

    // ----------------------------------------------------------- audiência
    defineField({
      name: "audienceBadge",
      title: "Etiqueta da seção",
      type: "localeString",
      group: "audiencia",
    }),
    defineField({
      name: "audienceTitle",
      title: "Título da seção",
      type: "localeString",
      group: "audiencia",
    }),
    defineField({
      name: "audienceDenial",
      title: "Bloco 1 — para quem NÃO é",
      description: `⚠️ Cada linha vira um parágrafo, sem marcador. A quebra de linha é parte do texto: a repetição do "Para quem…" só funciona uma linha por vez. ${LISTA}`,
      type: "array",
      of: [{ type: "localeText" }],
      group: "audiencia",
    }),
    defineField({
      name: "audienceAffirmation",
      title: "Bloco 2 — para quem é",
      description: LISTA,
      type: "array",
      of: [{ type: "localeText" }],
      group: "audiencia",
    }),
    defineField({
      name: "audiencePivot",
      title: "Bloco 3 — a virada",
      description: LISTA,
      type: "array",
      of: [{ type: "localeText" }],
      group: "audiencia",
    }),
    defineField({
      name: "audienceTurn",
      title: "Bloco 4 — o convite",
      description: LISTA,
      type: "array",
      of: [{ type: "localeText" }],
      group: "audiencia",
    }),
    defineField({
      name: "audienceClose",
      title: "Bloco 5 — o fecho",
      description: LISTA,
      type: "array",
      of: [{ type: "localeText" }],
      group: "audiencia",
    }),

    // ----------------------------------------------------------------- tese
    defineField({
      name: "thesisBadge",
      title: "Etiqueta da seção",
      type: "localeString",
      group: "tese",
    }),
    defineField({
      name: "thesisTitle",
      title: "Título da seção",
      type: "localeString",
      group: "tese",
    }),
    defineField({ name: "thesisP1", title: "Parágrafo 1", type: "localeText", group: "tese" }),
    defineField({ name: "thesisP2", title: "Parágrafo 2", type: "localeText", group: "tese" }),
    defineField({ name: "thesisP3", title: "Parágrafo 3", type: "localeText", group: "tese" }),
    defineField({ name: "thesisP4", title: "Parágrafo 4", type: "localeText", group: "tese" }),

    // ------------------------------------------------------------ perguntas
    defineField({
      name: "questionsTitle",
      title: "Título da seção",
      description: 'Hoje: "Três perguntas movem esta investigação"',
      type: "localeString",
      group: "perguntas",
    }),
    defineField({
      name: "q1",
      title: "Pergunta 01",
      description:
        "⚠️ As três perguntas aparecem na página inicial E no quadro da página Sobre. Editar aqui muda os dois lugares.",
      type: "localeText",
      group: "perguntas",
    }),
    defineField({ name: "q2", title: "Pergunta 02", type: "localeText", group: "perguntas" }),
    defineField({ name: "q3", title: "Pergunta 03", type: "localeText", group: "perguntas" }),

    // ------------------------------------------------------------------ ECP
    defineField({
      name: "ecpBadge",
      title: "Etiqueta da seção",
      type: "localeString",
      group: "ecp",
    }),
    defineField({
      name: "ecpTitle",
      title: "Título da seção",
      type: "localeString",
      group: "ecp",
    }),
    defineField({ name: "ecpP1", title: "Parágrafo 1", type: "localeText", group: "ecp" }),
    defineField({ name: "ecpP2", title: "Parágrafo 2", type: "localeText", group: "ecp" }),
    defineField({ name: "ecpP3", title: "Parágrafo 3", type: "localeText", group: "ecp" }),
    defineField({
      name: "ecpQuote",
      title: "Frase de fecho (em destaque)",
      type: "localeText",
      group: "ecp",
    }),

    // --------------------------------------------------------------- seções
    defineField({
      name: "dimensionsLabel",
      title: "Dimensões — etiqueta",
      type: "localeString",
      group: "secoes",
    }),
    defineField({
      name: "dimensionsTitle",
      title: "Dimensões — título",
      type: "localeString",
      group: "secoes",
    }),
    defineField({
      name: "vocabularyLabel",
      title: "Vocabulário — etiqueta",
      type: "localeString",
      group: "secoes",
    }),
    defineField({
      name: "vocabularyTitle",
      title: "Vocabulário — título",
      type: "localeString",
      group: "secoes",
    }),
    defineField({
      name: "vocabularyLead",
      title: "Vocabulário — linha de apoio",
      type: "localeText",
      group: "secoes",
    }),
    defineField({
      name: "sectionCta",
      title: "Botão das bibliotecas",
      description: 'Hoje: "Explorar a biblioteca"',
      type: "localeString",
      group: "secoes",
    }),

    // ----------------------------------------------------------- newsletter
    defineField({
      name: "newsletterBadge",
      title: "Etiqueta",
      type: "localeString",
      group: "newsletter",
    }),
    defineField({
      name: "newsletterTitle",
      title: "Título",
      type: "localeString",
      group: "newsletter",
    }),
    defineField({
      name: "newsletterLead",
      title: "Texto de apoio",
      type: "localeText",
      group: "newsletter",
    }),
    defineField({
      name: "newsletterCta",
      title: "Botão",
      type: "localeString",
      group: "newsletter",
    }),
    defineField({
      name: "newsletterPlaceholder",
      title: "Exemplo dentro do campo de e-mail",
      type: "localeString",
      group: "newsletter",
    }),
    defineField({
      name: "newsletterOk",
      title: "Mensagem de sucesso",
      type: "localeString",
      group: "newsletter",
    }),
    defineField({
      name: "newsletterError",
      title: "Mensagem de erro",
      type: "localeString",
      group: "newsletter",
    }),
  ],
  preview: {
    prepare: () => ({
      title: "Página inicial",
      subtitle: "Textos da home e as 3 perguntas da investigação",
    }),
  },
});
