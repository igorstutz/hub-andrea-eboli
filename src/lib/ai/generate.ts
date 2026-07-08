// Geração de conteúdo trilíngue (pt/en/es) a partir de um vídeo, via Claude.
// Recebe metadados + transcrição e devolve um JSON estruturado por tipo de
// conteúdo selecionado. A conversão para documentos do Sanity acontece depois.

import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

export type Targets = {
  video?: boolean;
  questions?: boolean;
  article?: boolean;
  concepts?: boolean;
};

export type Counts = {
  questions?: number; // nº de perguntas (FAQ)
  concepts?: number; // nº de conceitos
};

// Configuração editável no painel (singleton aiSettings). Tudo opcional:
// campos vazios caem nos padrões embutidos.
export type AiSettings = {
  voice?: string;
  videoInstructions?: string;
  faqInstructions?: string;
  conceptInstructions?: string;
  articleInstructions?: string;
  conceptLinkingInstructions?: string;
  model?: string;
  effort?: "low" | "medium" | "high";
};

// Conceito-pilar existente no hub, candidato a vínculo do conteúdo gerado.
export type HubConcept = {
  id: string; // _id do documento no Sanity
  title: string;
  definition?: string;
};

export type GenerationInput = {
  meta: {
    title?: string;
    author?: string;
    description?: string;
    url: string;
    durationSeconds?: number;
  };
  transcript: string;
  targets: Targets;
  counts?: Counts;
  settings?: AiSettings;
  // Direcionamentos pontuais para ESTA geração (campo da ferramenta no Studio).
  directions?: string;
  // Conceitos-pilar do hub: quando presentes, cada item gerado recebe
  // relatedConceptIds com os conceitos pertinentes.
  hubConcepts?: HubConcept[];
};

type Loc = { pt: string; en: string; es: string };

export type GeneratedContent = {
  video?: {
    title: Loc;
    directAnswer: Loc;
    summary: Loc;
    keyTakeaways: Loc;
    relatedConceptIds?: string[];
  };
  questions?: Array<{
    title: Loc;
    experience: Loc;
    answer: Loc;
    body: Loc;
    relatedConceptIds?: string[];
  }>;
  article?: { title: Loc; excerpt: Loc; body: Loc; relatedConceptIds?: string[] };
  concepts?: Array<{
    title: Loc;
    shortDefinition: Loc;
    fullDefinition: Loc;
    relatedConceptIds?: string[];
  }>;
};

const locSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    pt: { type: "string" },
    en: { type: "string" },
    es: { type: "string" },
  },
  required: ["pt", "en", "es"],
} as const;

function buildSchema(targets: Targets, hubConcepts?: HubConcept[]) {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  // Campo de vinculação aos conceitos-pilar: só existe quando o hub já tem
  // conceitos. O enum restringe aos ids reais (a IA não consegue inventar).
  const conceptIds = (hubConcepts ?? []).map((c) => c.id);
  const linkField = conceptIds.length
    ? {
        relatedConceptIds: {
          type: "array",
          items: { type: "string", enum: conceptIds },
        },
      }
    : {};
  const linkRequired = conceptIds.length ? ["relatedConceptIds"] : [];

  if (targets.video) {
    properties.video = {
      type: "object",
      additionalProperties: false,
      properties: {
        title: locSchema,
        directAnswer: locSchema,
        summary: locSchema,
        keyTakeaways: locSchema,
        ...linkField,
      },
      required: ["title", "directAnswer", "summary", "keyTakeaways", ...linkRequired],
    };
    required.push("video");
  }

  if (targets.questions) {
    properties.questions = {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: locSchema,
          experience: locSchema,
          answer: locSchema,
          body: locSchema,
          ...linkField,
        },
        required: ["title", "experience", "answer", "body", ...linkRequired],
      },
    };
    required.push("questions");
  }

  if (targets.article) {
    properties.article = {
      type: "object",
      additionalProperties: false,
      properties: {
        title: locSchema,
        excerpt: locSchema,
        body: locSchema,
        ...linkField,
      },
      required: ["title", "excerpt", "body", ...linkRequired],
    };
    required.push("article");
  }

  if (targets.concepts) {
    properties.concepts = {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: locSchema,
          shortDefinition: locSchema,
          fullDefinition: locSchema,
          ...linkField,
        },
        required: ["title", "shortDefinition", "fullDefinition", ...linkRequired],
      },
    };
    required.push("concepts");
  }

  return {
    type: "object",
    additionalProperties: false,
    properties,
    required,
  };
}

// Voz/persona PADRÃO. Pode ser substituída pelo campo "Voz e regras gerais"
// do painel (singleton aiSettings).
const DEFAULT_VOICE = `Você é estrategista de conteúdo do hub de autoridade da Andrea Eboli — pesquisadora de liderança, neurociência e "poder consciente" (a tese "Ser Poder").

Seu trabalho: transformar a transcrição de um vídeo/podcast da Andrea em conteúdo editorial estruturado, otimizado para SEO e para GEO (ser citada por modelos de IA).

Escreva na voz da Andrea: lúcida, calorosa, direta, sem jargão vazio nem clichê de autoajuda. Títulos são humanos e específicos (viram H1 e URL), não genéricos.`;

// Regras TÉCNICAS fixas — sempre aplicadas (garantem que a saída seja válida),
// não editáveis pelo painel.
const STRUCTURAL_RULES = `Regras obrigatórias (sempre):
- A TRANSCRIÇÃO é a fonte da verdade. Não invente fatos, números, datas ou citações que não estejam no material. Se algo não estiver claro, generalize com honestidade em vez de fabricar.
- Produza TUDO em três idiomas: português (pt), inglês (en) e espanhol (es). O pt é o original; en e es são traduções fiéis e naturais (não literais).
- Campos de corpo longo (keyTakeaways, body, fullDefinition) usam markdown leve: ## subtítulos, listas com "- ", e > para citações. Sem negrito/itálico inline.
- Responda APENAS com o JSON no formato exigido.`;

function composeSystem(settings?: AiSettings): string {
  const voice = settings?.voice?.trim() || DEFAULT_VOICE;
  return `${voice}\n\n${STRUCTURAL_RULES}`;
}

// Instruções PADRÃO por tipo (usadas quando o painel não define nada).
const DEFAULT_INSTRUCTIONS = {
  video:
    "directAnswer (1–2 frases citáveis, a tese central do episódio), summary (resumo de 2–3 frases) e keyTakeaways (principais aprendizados em markdown com lista).",
  questions:
    'cada item: "answer" é uma resposta objetiva e autossuficiente logo na primeira frase (é o trecho que as IAs citam); "experience" descreve como a dor é vivida (cria identificação); "body" aprofunda em markdown leve.',
  concepts: 'cada conceito com "shortDefinition" (UMA frase clara e citável) e fullDefinition.',
  article: "um artigo editorial coeso baseado no vídeo.",
} as const;

// Instrução PADRÃO de vinculação aos conceitos-pilar (editável no painel).
const DEFAULT_CONCEPT_LINKING = `Vincule cada item gerado a 1 a 3 conceitos do hub que tenham relação REAL e direta com o tema tratado. Não force vínculos: se nenhum conceito se aplicar de verdade, deixe a lista vazia.`;

function hubConceptsBlock(input: GenerationInput): string {
  const concepts = input.hubConcepts ?? [];
  if (!concepts.length) return "";
  const list = concepts
    .map((c) => `- ${c.id} — "${c.title}"${c.definition ? `: ${c.definition}` : ""}`)
    .join("\n");
  const linking =
    input.settings?.conceptLinkingInstructions?.trim() || DEFAULT_CONCEPT_LINKING;
  return `\nCONCEITOS-PILAR DO HUB (candidatos ao campo "relatedConceptIds" de cada item; use exatamente os ids abaixo):\n${list}\n\nComo vincular: ${linking}\n`;
}

function buildUserPrompt(input: GenerationInput): string {
  const { meta, transcript, targets, counts, settings, directions } = input;
  const instr = (custom: string | undefined, fallback: string) =>
    custom?.trim() || fallback;

  const wants: string[] = [];
  if (targets.video)
    wants.push(
      `- video: ${instr(settings?.videoInstructions, DEFAULT_INSTRUCTIONS.video)}`,
    );
  if (targets.questions)
    wants.push(
      `- questions: gere ${counts?.questions ?? 5} perguntas (FAQ) distintas e relevantes. ${instr(
        settings?.faqInstructions,
        DEFAULT_INSTRUCTIONS.questions,
      )}`,
    );
  if (targets.article)
    wants.push(
      `- article: ${instr(settings?.articleInstructions, DEFAULT_INSTRUCTIONS.article)}`,
    );
  if (targets.concepts)
    wants.push(
      `- concepts: gere ${counts?.concepts ?? 4} conceitos-chave abordados. ${instr(
        settings?.conceptInstructions,
        DEFAULT_INSTRUCTIONS.concepts,
      )}`,
    );

  const transcriptBlock = transcript
    ? `TRANSCRIÇÃO:\n"""\n${transcript}\n"""`
    : `ATENÇÃO: não há transcrição disponível. Trabalhe a partir do título e da descrição, sem inventar detalhes que não possa inferir com segurança.`;

  // Direcionamentos pontuais têm prioridade alta nesta geração.
  const directionsBlock = directions?.trim()
    ? `\nDIRECIONAMENTOS ESPECÍFICOS PARA ESTA GERAÇÃO (priorize e respeite estritamente):\n"""\n${directions.trim()}\n"""\n`
    : "";

  return `Vídeo: ${meta.title ?? "(sem título)"}
Canal/autor: ${meta.author ?? "—"}
URL: ${meta.url}
${meta.description ? `Descrição:\n${meta.description}\n` : ""}
Gere os seguintes tipos de conteúdo:
${wants.join("\n")}
${hubConceptsBlock(input)}${directionsBlock}
${transcriptBlock}`;
}

export async function generateContent(
  input: GenerationInput,
): Promise<GeneratedContent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY ausente no ambiente.");
  }

  const client = new Anthropic({ apiKey });
  const schema = buildSchema(input.targets, input.hubConcepts);

  const model = input.settings?.model?.trim() || MODEL;
  const effort = input.settings?.effort || "medium";

  const stream = client.messages.stream({
    model,
    max_tokens: 32000,
    thinking: { type: "adaptive" },
    output_config: {
      effort,
      format: { type: "json_schema", schema },
    },
    system: composeSystem(input.settings),
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  });

  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") {
    throw new Error("O modelo recusou a geração para este conteúdo.");
  }

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  try {
    return JSON.parse(text) as GeneratedContent;
  } catch {
    throw new Error("Resposta do modelo não veio em JSON válido.");
  }
}
