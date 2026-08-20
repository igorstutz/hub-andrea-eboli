// Geração de conteúdo trilíngue (pt/en/es) a partir de um MATERIAL DE ORIGEM,
// via Claude: a transcrição de um vídeo/podcast do YouTube ou um texto já
// publicado pela Andrea (Forbes, LinkedIn). Devolve um JSON estruturado por tipo
// de conteúdo selecionado; a conversão para documentos do Sanity vem depois.
//
// CONCEITOS não são gerados por aqui (regra de 06/08/2026): entram à mão no
// Studio. O que cada fonte pode gerar está em src/lib/ingest/sources.ts.

import Anthropic from "@anthropic-ai/sdk";
import {
  PUBLISHED_TEXT_SOURCES,
  type ContentSource,
} from "@/lib/ingest/sources";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

export type Targets = {
  video?: boolean;
  questions?: boolean;
  article?: boolean;
};

export type Counts = {
  questions?: number; // nº de perguntas (FAQ)
};

// Configuração editável no painel (singleton aiSettings). Tudo opcional:
// campos vazios caem nos padrões embutidos.
export type AiSettings = {
  voice?: string;
  videoInstructions?: string;
  faqInstructions?: string;
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
  /** De onde veio o material (define rótulos e regras do prompt). */
  source: ContentSource;
  meta: {
    title?: string;
    author?: string;
    description?: string;
    url: string;
    durationSeconds?: number;
  };
  /** Transcrição (YouTube) ou texto do artigo já publicado (Forbes/LinkedIn). */
  material: string;
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
const DEFAULT_VOICE = `Você escreve como Andrea Eboli: pesquisadora, escritora e professora, fundadora da Academia do Poder e criadora da Estrutura Consciente de Poder (ECP). Sua investigação é sobre as novas relações entre poder, identidade e liderança na vida contemporânea. Você não é coach nem palestrante motivacional. É uma pesquisadora que pensa em voz alta, com rigor e cuidado, e escreve para pessoas inteligentes.

Seu trabalho: transformar um material de origem da Andrea (a transcrição de um vídeo ou podcast dela, ou um texto que ela já publicou na Forbes ou no LinkedIn) em conteúdo editorial estruturado para o hub, otimizado para SEO e para GEO (ser citada por modelos de IA), sem nunca soar como texto de máquina.

A TESE que organiza todo o raciocínio (definição da própria Andrea):
O mundo nos ensinou a TER poder, mas ninguém nos ensinou a SER. Ser Poder é não depender daquilo que você tem para reconhecer quem você é: encontrar em si uma potência que não desaparece quando cargos, conquistas, relações ou reconhecimento mudam.

TRÊS perguntas movem a investigação:
1. Por que pessoas que têm poder parecem perdê-lo quando deixam cargos, títulos ou posições?
2. Por que tantas outras, mesmo cercadas de reconhecimento, influência e performance, não se sentem verdadeiramente poderosas?
3. E por que algumas pessoas, mesmo sem cargos, títulos ou reconhecimento, revelam uma potência que parece não depender de nada disso?

Dessas perguntas nasceu a ECP (Estrutura Consciente de Poder), o método autoral da Andrea para atravessar a distância entre TER poder e SER poder. A ECP articula três dimensões inseparáveis:
- IDENTIDADE: a capacidade de reconhecer quem você é e confiar na própria experiência, sem depender continuamente da confirmação externa.
- CONTEXTO: a compreensão das forças, relações e ambientes que influenciam a forma como você se percebe e exerce sua potência.
- MOVIMENTO: a capacidade de transformar consciência em escolha e escolha em ação, sem ser conduzido automaticamente pelo contexto.
Como ela mesma resume: não é uma fórmula para controlar a vida, é uma estrutura para não desaparecer dentro dela.

REGISTRO (como a voz soa):
- Lúcida, precisa e calorosa. Séria sem ser fria; próxima sem ser íntima demais.
- Postura de investigação, não de receita. Nomeia o que a pessoa vive antes de orientar: a experiência é a porta emocional, o entendimento é o caminho.
- Frases afirmativas, específicas e humanas. Uma ideia por frase, o concreto antes do abstrato.
- Dirige-se ao leitor por "você", com respeito e sem condescendência.

O QUE MATA A VOZ (evite sempre):
- Clichê de autoajuda: "empodere-se", "a melhor versão de você", "acredite em você", "saia da zona de conforto", "o segredo é".
- Jargão corporativo vazio: "sinergia", "mindset vencedor", "alavancar", "protagonismo", "entregar valor".
- Hype: exclamações, superlativos gratuitos, emojis, promessas ("garanto", "infalível", "em 3 passos simples").
- Frases genéricas que caberiam em qualquer post motivacional. Se a frase serviria para qualquer autor, reescreva até que só a Andrea pudesse tê-la escrito.

VOCABULÁRIO AUTORAL (use com naturalidade, nunca forçado):
- TER PODER: a potência condicionada a algo que precisamos ter, manter ou receber.
- SER PODER: a potência que não depende daquilo que temos para reconhecermos quem somos.
- O PÊNDULO: o movimento entre extremos que parecem nos fortalecer, mas nos mantêm dependentes deles.
- O CENTRO DO PÊNDULO: o lugar psicológico a partir do qual sentimos, escolhemos e agimos sem sermos arrastados pelos extremos.
- A ENTREGA DO PODER: o momento em que algo externo passa a determinar nosso valor, nossa estabilidade ou nossa capacidade de agir.
- O SEQUESTRO DA IDENTIDADE PELO CONTEXTO: quando o contexto deixa de apenas nos influenciar e passa a julgar e organizar nossa experiência interna.

Títulos são humanos e específicos (viram H1 e URL): a pergunta real que a pessoa faria, jamais um rótulo genérico.`;

// Regras TÉCNICAS fixas — sempre aplicadas (garantem que a saída seja válida),
// não editáveis pelo painel.
//
// A regra de PONTUAÇÃO é pedido explícito da Andrea (19/08/2026): o travessão
// solto é a digital mais óbvia de texto de IA, e o conteúdo gerado até aqui
// estava cheio deles. Fica aqui, no bloco fixo, para não ser desligada por
// engano no painel.
const STRUCTURAL_RULES = `Regras obrigatórias (sempre):
- O MATERIAL DE ORIGEM é a fonte da verdade. Não invente fatos, números, datas ou citações que não estejam nele. Se algo não estiver claro, generalize com honestidade em vez de fabricar.
- PONTUAÇÃO: nunca use travessão (— ou –) para separar ideias dentro da frase. Use ponto, dois-pontos, vírgula ou parênteses. Isso vale para os três idiomas. Também evite os outros vícios de texto de máquina: a construção "não é X, é Y" repetida, listas de três adjetivos em série, abertura por "Em um mundo onde…", e frases de efeito que não dizem nada de concreto. Prefira o ponto: duas frases curtas em vez de uma emendada.
- Produza TUDO em três idiomas: português (pt), inglês (en) e espanhol (es). O pt é o original; en e es soam nativas e preservam o MESMO registro e intenção (não são traduções literais). Os termos de marca (Ser Poder, Ter Poder, Academia do Poder, ECP / Estrutura Consciente de Poder) permanecem em português nos três idiomas.
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
    "directAnswer: 1–2 frases citáveis com a tese central do episódio (é o trecho que as IAs citam ao resumir o vídeo). summary: 2–3 frases situando o que o episódio investiga e por quê. keyTakeaways: os aprendizados reais em markdown com lista; cada item é uma ideia fechada, não um resumo diluído.",
  questions:
    'Cada item é uma dúvida humana REAL, no formato em que a pessoa a faria (vira título e URL). Trabalhe em camadas: "experience" abre pela dor vivida e cria identificação imediata ("Se você...", "Talvez você já tenha..."); "answer" entrega, logo na primeira frase, uma resposta objetiva e autossuficiente (o trecho que as IAs citam); "body" aprofunda em markdown leve e, quando fizer sentido, faz a ponte para a tese (Ser Poder, a ECP ou um conceito do hub). Sempre nomear a experiência antes de orientar.',
  article:
    "Um artigo editorial coeso que segue a linha de raciocínio da Andrea: parte de uma tensão real, desenvolve com lucidez e fecha conectando à tese. Use ## para subtítulos que guiam a leitura; parágrafos densos, porém respiráveis. Cada seção precisa avançar o argumento, nada de preencher espaço.",
} as const;

// Instrução PADRÃO de vinculação aos conceitos-pilar (editável no painel).
const DEFAULT_CONCEPT_LINKING = `Vincule cada item gerado a 1 a 3 conceitos do hub que tenham relação REAL e direta com o tema tratado. Não force vínculos: se nenhum conceito se aplicar de verdade, deixe a lista vazia.`;

function hubConceptsBlock(input: GenerationInput): string {
  const concepts = input.hubConcepts ?? [];
  if (!concepts.length) return "";
  const list = concepts
    .map((c) => `- ${c.id} = "${c.title}"${c.definition ? `: ${c.definition}` : ""}`)
    .join("\n");
  const linking =
    input.settings?.conceptLinkingInstructions?.trim() || DEFAULT_CONCEPT_LINKING;
  return `\nCONCEITOS-PILAR DO HUB (candidatos ao campo "relatedConceptIds" de cada item; use exatamente os ids abaixo):\n${list}\n\nComo vincular: ${linking}\n`;
}

// Como o material se chama no prompt, por fonte.
const MATERIAL_LABEL: Record<ContentSource, string> = {
  youtube: "TRANSCRIÇÃO DO VÍDEO/PODCAST",
  forbes: "ARTIGO QUE A ANDREA PUBLICOU NA FORBES",
  linkedin: "PUBLICAÇÃO QUE A ANDREA FEZ NO LINKEDIN",
};

const ORIGIN_LABEL: Record<ContentSource, string> = {
  youtube: "Vídeo/podcast (YouTube)",
  forbes: "Artigo publicado (Forbes)",
  linkedin: "Publicação (LinkedIn)",
};

// Regra extra quando o material JÁ está publicado em outro veículo: o conteúdo
// do hub tem de ser texto novo, para não competir com o original no Google.
const REPUBLISH_RULE = `ATENÇÃO: o material já está publicado em outro veículo. Reescreva para o hub: mesma tese, mesmos exemplos e mesmas conclusões, TEXTO NOVO. Não reaproveite frases inteiras do original (evita conteúdo duplicado no Google). O texto é da própria Andrea, então não cite o veículo como se fosse fonte de terceiros; no máximo aprofunde o que lá ficou resumido.`;

function buildUserPrompt(input: GenerationInput): string {
  const { source, meta, material, targets, counts, settings, directions } = input;
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

  const materialBlock = material
    ? `${MATERIAL_LABEL[source]}:\n"""\n${material}\n"""`
    : `ATENÇÃO: o material de origem não pôde ser lido. Trabalhe a partir do título e da descrição, sem inventar detalhes que não possa inferir com segurança.`;

  const republishBlock = PUBLISHED_TEXT_SOURCES.includes(source)
    ? `\n${REPUBLISH_RULE}\n`
    : "";

  // Direcionamentos pontuais têm prioridade alta nesta geração.
  const directionsBlock = directions?.trim()
    ? `\nDIRECIONAMENTOS ESPECÍFICOS PARA ESTA GERAÇÃO (priorize e respeite estritamente):\n"""\n${directions.trim()}\n"""\n`
    : "";

  return `Origem: ${ORIGIN_LABEL[source]}
Título: ${meta.title ?? "(sem título)"}
Autor/canal: ${meta.author ?? "não informado"}
URL: ${meta.url}
${meta.description ? `Descrição:\n${meta.description}\n` : ""}
Gere os seguintes tipos de conteúdo:
${wants.join("\n")}
${hubConceptsBlock(input)}${republishBlock}${directionsBlock}
${materialBlock}`;
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
