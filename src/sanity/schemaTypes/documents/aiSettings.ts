import { defineType, defineField } from "sanity";

// Singleton: configuração dos "agentes" de geração de conteúdo por IA.
// Os campos abaixo alimentam o prompt usado em /api/ingest/generate (ingestão de
// links do YouTube, Forbes e LinkedIn). Campos vazios caem no padrão seguro
// embutido no código (a geração nunca quebra).
//
// Conceitos NÃO são gerados por link (entram à mão no Studio) — por isso não há
// mais instruções nem quantidade padrão de conceitos aqui.
export const aiSettings = defineType({
  name: "aiSettings",
  title: "Agentes de IA",
  type: "document",
  groups: [
    { name: "instructions", title: "Instruções", default: true },
    { name: "advanced", title: "Avançado" },
  ],
  fields: [
    defineField({
      name: "voice",
      title: "Ajustes de voz",
      description:
        "Ajustes de voz e tom, ANEXADOS à voz base da Andrea (que já vem embutida " +
        "e sempre ativa — a tese, o registro, o léxico próprio). Use só para afinar: " +
        "ex. 'seja um pouco mais direta', 'evite a palavra X', 'prefira exemplos do " +
        "mundo corporativo'. Não precisa reescrever a persona do zero; o que escrever " +
        "aqui prevalece em caso de conflito. As regras técnicas (3 idiomas, formato, " +
        "não inventar fatos) são fixas. Deixe vazio para usar apenas a voz base.",
      type: "text",
      rows: 8,
      group: "instructions",
    }),
    defineField({
      name: "videoInstructions",
      title: "Instruções — Vídeo / Resumo",
      description:
        "O que o resumo do vídeo deve conter e como (resposta direta, resumo, takeaways). Vazio = padrão.",
      type: "text",
      rows: 4,
      group: "instructions",
    }),
    defineField({
      name: "faqInstructions",
      title: "Instruções — FAQ (perguntas)",
      description: "Como formular as perguntas e respostas. Vazio = padrão.",
      type: "text",
      rows: 4,
      group: "instructions",
    }),
    defineField({
      name: "articleInstructions",
      title: "Instruções — Artigo / Pesquisa",
      description: "Estrutura e abordagem do artigo editorial. Vazio = padrão.",
      type: "text",
      rows: 4,
      group: "instructions",
    }),
    defineField({
      name: "conceptLinkingInstructions",
      title: "Instruções — Vinculação aos conceitos do hub",
      description:
        "Critério para a IA escolher a quais conceitos-pilar do hub (Poder Consciente, " +
        "Liderança, Posicionamento…) cada conteúdo gerado deve ser vinculado. " +
        'Vazio = padrão ("1 a 3 conceitos com relação real e direta; não force vínculos").',
      type: "text",
      rows: 4,
      group: "instructions",
    }),
    defineField({
      name: "model",
      title: "Modelo de IA",
      description:
        "Modelo usado na geração. Opus = melhor qualidade; Sonnet = equilíbrio; Haiku = mais rápido/barato.",
      type: "string",
      group: "advanced",
      options: {
        list: [
          { title: "Claude Opus 4.8 (qualidade)", value: "claude-opus-4-8" },
          { title: "Claude Sonnet 4.6 (equilíbrio)", value: "claude-sonnet-4-6" },
          { title: "Claude Haiku 4.5 (rápido)", value: "claude-haiku-4-5" },
        ],
      },
    }),
    defineField({
      name: "effort",
      title: "Nível de esforço",
      description:
        "Quanto a IA 'pensa' antes de escrever. Maior = melhor qualidade, porém mais lento e caro.",
      type: "string",
      group: "advanced",
      options: {
        list: [
          { title: "Baixo (rápido)", value: "low" },
          { title: "Médio (padrão)", value: "medium" },
          { title: "Alto (qualidade)", value: "high" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "defaultQuestionsCount",
      title: "Quantidade padrão de perguntas (FAQ)",
      type: "number",
      group: "advanced",
      validation: (Rule) => Rule.min(1).max(12),
    }),
  ],
  preview: { prepare: () => ({ title: "Agentes de IA" }) },
});
