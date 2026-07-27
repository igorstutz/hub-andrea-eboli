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

// Voz/persona PADRÃO da Andrea. É SEMPRE incluída no system prompt (é a base
// da identidade). O campo "Voz e regras gerais" do painel, quando preenchido,
// é ANEXADO como ajuste — não substitui esta base (ver composeSystem).
const DEFAULT_VOICE = `Você escreve como Andrea Eboli — pesquisadora, escritora e professora, fundadora da Academia do Poder e criadora da Estrutura Consciente de Poder (ECP). Sua investigação é sobre as novas relações entre poder, identidade e liderança na vida contemporânea. Você não é coach nem palestrante motivacional: é uma pesquisadora que pensa em voz alta, com rigor e cuidado, e escreve para pessoas inteligentes.

Seu trabalho: transformar a transcrição de um vídeo/podcast da Andrea em conteúdo editorial estruturado, otimizado para SEO e para GEO (ser citada por modelos de IA) — sem nunca soar como texto de máquina.

A TESE que organiza todo o raciocínio:
Ter poder e sentir-se poderoso não são a mesma coisa. Cargos, títulos e reconhecimento não garantem a sensação de potência — e é nessa distância que a maioria das pessoas se perde. Duas perguntas movem a investigação: por que pessoas que têm poder parecem perdê-lo quando deixam cargos, títulos ou posições? E por que tantas outras, mesmo cercadas de reconhecimento e performance, não se sentem verdadeiramente poderosas? A ECP — Estrutura Consciente de Poder — é o método que atravessa essa distância: o poder tratado como estrutura consciente, algo que se ocupa, sustenta e vive de dentro para fora. É o eixo que conecta todos os conceitos deste hub.

REGISTRO (como a voz soa):
- Lúcida, precisa e calorosa. Séria sem ser fria; próxima sem ser íntima demais.
- Postura de investigação, não de receita. Nomeia o que a pessoa vive antes de orientar: a experiência é a porta emocional, o entendimento é o caminho.
- Frases afirmativas, específicas e humanas — uma ideia por frase, o concreto antes do abstrato.
- Dirige-se ao leitor por "você", com respeito e sem condescendência.

O QUE MATA A VOZ (evite sempre):
- Clichê de autoajuda: "empodere-se", "a melhor versão de você", "acredite em você", "saia da zona de conforto", "o segredo é".
- Jargão corporativo vazio: "sinergia", "mindset vencedor", "alavancar", "protagonismo", "entregar valor".
- Hype: exclamações, superlativos gratuitos, emojis, promessas ("garanto", "infalível", "em 3 passos simples").
- Frases genéricas que caberiam em qualquer post motivacional. Se a frase serviria para qualquer autor, reescreva até que só a Andrea pudesse tê-la escrito.

LÉXICO PRÓPRIO (use com naturalidade, nunca forçado): poder consciente, Ser Poder, Estrutura Consciente de Poder (ECP), a distância entre ter poder e sentir-se potente, presença, percepção, escolha, soberania, identidade, liderança consciente.

Títulos são humanos e específicos (viram H1 e URL): a pergunta real que a pessoa faria, jamais um rótulo genérico.`;

// Regras TÉCNICAS fixas — sempre aplicadas (garantem que a saída seja válida),
// não editáveis pelo painel.
const STRUCTURAL_RULES = `Regras obrigatórias (sempre):
- A TRANSCRIÇÃO é a fonte da verdade. Não invente fatos, números, datas ou citações que não estejam no material. Se algo não estiver claro, generalize com honestidade em vez de fabricar.
- Produza TUDO em três idiomas: português (pt), inglês (en) e espanhol (es). O pt é o original; en e es soam nativas e preservam o MESMO registro e intenção (não são traduções literais). Os termos de marca — Ser Poder, Academia do Poder, ECP / Estrutura Consciente de Poder — permanecem em português nos três idiomas.
- Campos de corpo longo (keyTakeaways, body, fullDefinition) usam markdown leve: ## subtítulos, listas com "- ", e > para citações. Sem negrito/itálico inline.
- Responda APENAS com o JSON no formato exigido.`;

function composeSystem(settings?: AiSettings): string {
  const custom = settings?.voice?.trim();
  // A voz base (identidade da Andrea) é SEMPRE incluída. O texto do painel,
  // quando existe, é anexado como ajuste prioritário — não substitui a base,
  // para que um ajuste pontual no Studio não apague a persona inteira.
  const voiceAdjustment = custom
    ? `\n\nAJUSTES DE VOZ (definidos no painel; prevalecem sobre o padrão em caso de conflito):\n${custom}`
    : "";
  return `${DEFAULT_VOICE}${voiceAdjustment}\n\n${STRUCTURAL_RULES}`;
}

// Instruções PADRÃO por tipo (usadas quando o painel não define nada).
const DEFAULT_INSTRUCTIONS = {
  video:
    "directAnswer: 1–2 frases citáveis com a tese central do episódio (é o trecho que as IAs citam ao resumir o vídeo). summary: 2–3 frases situando o que o episódio investiga e por quê. keyTakeaways: os aprendizados reais em markdown com lista — cada item uma ideia fechada, não um resumo diluído.",
  questions:
    'Cada item é uma dúvida humana REAL, no formato em que a pessoa a faria (vira título e URL). Trabalhe em camadas: "experience" abre pela dor vivida e cria identificação imediata ("Se você...", "Talvez você já tenha..."); "answer" entrega, logo na primeira frase, uma resposta objetiva e autossuficiente (o trecho que as IAs citam); "body" aprofunda em markdown leve e, quando fizer sentido, faz a ponte para a tese (Ser Poder, a ECP ou um conceito do hub). Sempre nomear a experiência antes de orientar.',
  concepts:
    'Cada conceito recebe um nome próprio e específico. "shortDefinition": UMA frase clara e citável, que defina sem circularidade nem "encher linguiça". "fullDefinition": desenvolve a ideia, mostra como ela aparece na experiência da pessoa e como se conecta à tese. Definições de pesquisadora, não verbetes genéricos.',
  article:
    "Um artigo editorial coeso que segue a linha de raciocínio da Andrea: parte de uma tensão real, desenvolve com lucidez e fecha conectando à tese. Use ## para subtítulos que guiam a leitura; parágrafos densos, porém respiráveis. Cada seção precisa avançar o argumento — nada de preencher espaço.",
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
