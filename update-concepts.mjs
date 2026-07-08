/*
  Substitui os conceitos de EXEMPLO pelos conceitos REAIS do hub:
    Poder Consciente | Liderança | Posicionamento | Comportamento Humano | Estrutura Consciente de Poder

  - Cria os 5 novos conceitos (createOrReplace = idempotente).
  - Reponta as perguntas do seed que referenciavam os conceitos antigos.
  - Apaga os 4 conceitos antigos (ser-poder, ter-poder, soberania, sobrevivencia-que-funciona).
  Tudo em UMA transação (referências "para frente" são aceitas assim).

  Rodar:  npx sanity exec update-concepts.mjs --with-user-token
*/

const apiVersion = "2024-10-01";
const token = process.env.SANITY_WRITE_TOKEN;

let client;
if (token) {
  const { createClient } = await import("@sanity/client");
  client = createClient({ projectId: "52ssivbg", dataset: "production", apiVersion, token, useCdn: false });
} else {
  const { getCliClient } = await import("sanity/cli");
  client = getCliClient({ apiVersion });
}

let k = 0;
const key = () => `k${k++}`;
const tri = (pt, en, es) => ({ pt, en, es });
const block = (text) => ({
  _type: "block",
  _key: key(),
  style: "normal",
  markDefs: [],
  children: [{ _type: "span", _key: key(), text, marks: [] }],
});
const triBlock = (pt, en, es) => ({ pt: [block(pt)], en: [block(en)], es: [block(es)] });
const slug = (current) => ({ _type: "slug", current });
const refKeyed = (id) => ({ _type: "reference", _ref: id, _key: key() });

const NOTA = {
  pt: " (Conteúdo provisório: ajuste no Studio.)",
  en: " (Draft content: edit in the Studio.)",
  es: " (Contenido provisional: edítalo en el Studio.)",
};

const concepts = [
  {
    _id: "concept-poder-consciente", _type: "concept",
    title: tri("Poder Consciente", "Conscious Power", "Poder Consciente"),
    slug: slug("poder-consciente"),
    shortDefinition: tri(
      "Poder exercido com consciência de si, dos próprios padrões e do impacto que se causa — força que constrói, em vez de dominar.",
      "Power exercised with awareness of oneself, one's patterns and the impact one creates — strength that builds instead of dominating.",
      "Poder ejercido con conciencia de uno mismo, de los propios patrones y del impacto que se genera — fuerza que construye en lugar de dominar.",
    ),
    fullDefinition: triBlock(
      "Poder Consciente é o poder que nasce do autoconhecimento: você reconhece seus padrões, entende o efeito que provoca nas pessoas e escolhe agir a partir da coerência, não do impulso ou do medo. É a diferença entre impor e influenciar, entre ocupar espaço e tomar o espaço dos outros." + NOTA.pt,
      "Conscious Power is power born of self-knowledge: you recognize your patterns, understand the effect you have on people and choose to act from coherence, not from impulse or fear. It is the difference between imposing and influencing, between occupying your space and taking space from others." + NOTA.en,
      "El Poder Consciente es el poder que nace del autoconocimiento: reconoces tus patrones, entiendes el efecto que provocas en las personas y eliges actuar desde la coherencia, no desde el impulso o el miedo. Es la diferencia entre imponer e influir, entre ocupar tu espacio y quitarle el espacio a los demás." + NOTA.es,
    ),
    relatedConcepts: [refKeyed("concept-estrutura-consciente-de-poder"), refKeyed("concept-comportamento-humano")],
  },
  {
    _id: "concept-lideranca", _type: "concept",
    title: tri("Liderança", "Leadership", "Liderazgo"),
    slug: slug("lideranca"),
    shortDefinition: tri(
      "A capacidade de conduzir pessoas e contextos a partir da coerência interna — presença que inspira, não controle que impõe.",
      "The capacity to lead people and contexts from inner coherence — presence that inspires, not control that imposes.",
      "La capacidad de conducir personas y contextos desde la coherencia interna — presencia que inspira, no control que impone.",
    ),
    fullDefinition: triBlock(
      "Liderança não é cargo: é a forma como você se posiciona diante das pessoas e das decisões. Quem lidera com Poder Consciente sustenta conversas difíceis, dá direção sem anular o outro e cria ambientes em que as pessoas crescem — porque a autoridade vem da coerência, não da hierarquia." + NOTA.pt,
      "Leadership is not a title: it is how you position yourself before people and decisions. Those who lead with Conscious Power hold difficult conversations, give direction without erasing others and create environments where people grow — because authority comes from coherence, not hierarchy." + NOTA.en,
      "El liderazgo no es un cargo: es la forma en que te posicionas ante las personas y las decisiones. Quien lidera con Poder Consciente sostiene conversaciones difíciles, da dirección sin anular al otro y crea ambientes donde las personas crecen — porque la autoridad viene de la coherencia, no de la jerarquía." + NOTA.es,
    ),
    relatedConcepts: [refKeyed("concept-poder-consciente"), refKeyed("concept-posicionamento")],
  },
  {
    _id: "concept-posicionamento", _type: "concept",
    title: tri("Posicionamento", "Positioning", "Posicionamiento"),
    slug: slug("posicionamento"),
    shortDefinition: tri(
      "O ato de ocupar o próprio lugar com clareza: dizer quem você é, o que sustenta e o que não negocia.",
      "The act of occupying your own place with clarity: stating who you are, what you stand for and what you do not negotiate.",
      "El acto de ocupar tu propio lugar con claridad: decir quién eres, qué sostienes y qué no negocias.",
    ),
    fullDefinition: triBlock(
      "Posicionamento é tornar visível a sua coerência: comunicar limites, opiniões e valores sem pedir licença para existir. Não é rigidez nem confronto — é clareza. Quem se posiciona deixa de ser definido pelos outros e passa a ser reconhecido pelo que de fato é." + NOTA.pt,
      "Positioning is making your coherence visible: communicating boundaries, opinions and values without asking permission to exist. It is not rigidity or confrontation — it is clarity. Those who position themselves stop being defined by others and start being recognized for who they truly are." + NOTA.en,
      "Posicionarse es hacer visible tu coherencia: comunicar límites, opiniones y valores sin pedir permiso para existir. No es rigidez ni confrontación — es claridad. Quien se posiciona deja de ser definido por los demás y pasa a ser reconocido por lo que realmente es." + NOTA.es,
    ),
    relatedConcepts: [refKeyed("concept-lideranca"), refKeyed("concept-poder-consciente")],
  },
  {
    _id: "concept-comportamento-humano", _type: "concept",
    title: tri("Comportamento Humano", "Human Behavior", "Comportamiento Humano"),
    slug: slug("comportamento-humano"),
    shortDefinition: tri(
      "O estudo dos padrões que movem as pessoas: o que repetimos, por que repetimos e como isso molda nossos resultados.",
      "The study of the patterns that drive people: what we repeat, why we repeat it and how it shapes our results.",
      "El estudio de los patrones que mueven a las personas: qué repetimos, por qué lo repetimos y cómo eso moldea nuestros resultados.",
    ),
    fullDefinition: triBlock(
      "Todo comportamento tem uma função — inclusive os que hoje te limitam. Entender o comportamento humano é enxergar os padrões por trás das reações: os seus e os dos outros. É essa leitura que permite sair do piloto automático e escolher respostas em vez de repetir reações." + NOTA.pt,
      "Every behavior has a function — including the ones that limit you today. Understanding human behavior means seeing the patterns behind reactions: yours and other people's. That reading is what allows you to leave autopilot and choose responses instead of repeating reactions." + NOTA.en,
      "Todo comportamiento tiene una función — incluso los que hoy te limitan. Entender el comportamiento humano es ver los patrones detrás de las reacciones: los tuyos y los de los demás. Esa lectura es la que permite salir del piloto automático y elegir respuestas en lugar de repetir reacciones." + NOTA.es,
    ),
    relatedConcepts: [refKeyed("concept-poder-consciente"), refKeyed("concept-estrutura-consciente-de-poder")],
  },
  {
    _id: "concept-estrutura-consciente-de-poder", _type: "concept",
    title: tri("Estrutura Consciente de Poder", "Conscious Power Structure", "Estructura Consciente de Poder"),
    slug: slug("estrutura-consciente-de-poder"),
    shortDefinition: tri(
      "O arcabouço que integra autoconsciência, comportamento humano e posicionamento para sustentar o poder de forma consciente.",
      "The framework that integrates self-awareness, human behavior and positioning to sustain power consciously.",
      "El marco que integra autoconciencia, comportamiento humano y posicionamiento para sostener el poder de forma consciente.",
    ),
    fullDefinition: triBlock(
      "A Estrutura Consciente de Poder é o mapa que conecta as peças: consciência de si (quem você é), leitura do comportamento humano (como as pessoas funcionam) e posicionamento (como você ocupa o seu lugar). Quando essas dimensões operam juntas, o poder deixa de ser circunstância e vira estrutura — algo que você sustenta em qualquer contexto." + NOTA.pt,
      "The Conscious Power Structure is the map that connects the pieces: self-awareness (who you are), reading human behavior (how people work) and positioning (how you occupy your place). When these dimensions operate together, power stops being circumstance and becomes structure — something you sustain in any context." + NOTA.en,
      "La Estructura Consciente de Poder es el mapa que conecta las piezas: conciencia de uno mismo (quién eres), lectura del comportamiento humano (cómo funcionan las personas) y posicionamiento (cómo ocupas tu lugar). Cuando esas dimensiones operan juntas, el poder deja de ser circunstancia y se convierte en estructura — algo que sostienes en cualquier contexto." + NOTA.es,
    ),
    relatedConcepts: [refKeyed("concept-poder-consciente"), refKeyed("concept-comportamento-humano"), refKeyed("concept-posicionamento"), refKeyed("concept-lideranca")],
  },
];

// Perguntas do seed que referenciavam os conceitos antigos → repontar para os novos.
const questionPatches = {
  "question-parar-de-buscar-validacao": ["concept-comportamento-humano", "concept-poder-consciente"],
  "question-chefe-que-me-diminui": ["concept-posicionamento", "concept-lideranca"],
  "question-recuperar-confianca": ["concept-poder-consciente"],
  "question-vazia-apesar-do-sucesso": ["concept-poder-consciente", "concept-comportamento-humano"],
};

const oldConceptIds = [
  "concept-ser-poder",
  "concept-ter-poder",
  "concept-soberania",
  "concept-sobrevivencia-que-funciona",
];

const tx = client.transaction();
for (const doc of concepts) tx.createOrReplace(doc);
for (const [qId, conceptIds] of Object.entries(questionPatches)) {
  tx.patch(qId, (p) => p.set({ relatedConcepts: conceptIds.map(refKeyed) }));
}
for (const id of oldConceptIds) tx.delete(id);

const res = await tx.commit();
console.log("OK — transação aplicada:", res.transactionId);
console.log(`Criados/atualizados: ${concepts.length} conceitos; repontadas: ${Object.keys(questionPatches).length} perguntas; apagados: ${oldConceptIds.length} conceitos antigos.`);
