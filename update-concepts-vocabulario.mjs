/*
  Substitui os 5 conceitos anteriores (Poder Consciente | Liderança |
  Posicionamento | Comportamento Humano | Estrutura Consciente de Poder) pelo
  VOCABULÁRIO REAL que a Andrea definiu no documento de 19/08/2026:

    Dimensões da ECP .... Identidade | Contexto | Movimento
    Vocabulário ......... Ter Poder | Ser Poder | O Pêndulo |
                          O Centro do Pêndulo | A Entrega do Poder |
                          O Sequestro da Identidade pelo Contexto

  As definições curtas são as PALAVRAS DELA, copiadas do documento — nada foi
  inventado. A "definição completa" fica VAZIA de propósito: é conteúdo autoral
  que só ela pode escrever (preencher no Studio).

  O que o script faz, tudo em UMA transação:
   1. cria os 9 conceitos novos (createOrReplace = idempotente);
   2. reponta, um por um, os 28 documentos publicados que apontavam para os
      conceitos antigos (mapa manual abaixo, feito a partir dos títulos);
   3. limpa referências residuais em qualquer outro documento (inclusive
      rascunhos) que ainda aponte para os antigos;
   4. apaga os 5 conceitos antigos.

  Rodar:  npx sanity exec update-concepts-vocabulario.mjs --with-user-token
*/

const apiVersion = "2024-10-01";
const token = process.env.SANITY_WRITE_TOKEN;

let client;
if (token) {
  const { createClient } = await import("@sanity/client");
  client = createClient({
    projectId: "52ssivbg",
    dataset: "production",
    apiVersion,
    token,
    useCdn: false,
  });
} else {
  const { getCliClient } = await import("sanity/cli");
  client = getCliClient({ apiVersion });
}

let k = 0;
const key = () => `k${k++}`;
const tri = (pt, en, es) => ({ pt, en, es });
const slug = (current) => ({ _type: "slug", current });
const refKeyed = (id) => ({ _type: "reference", _ref: id, _key: key() });

// ---------------------------------------------------------------- conceitos
const D = {
  identidade: "concept-identidade",
  contexto: "concept-contexto",
  movimento: "concept-movimento",
};
const V = {
  terPoder: "concept-ter-poder",
  serPoder: "concept-ser-poder",
  pendulo: "concept-o-pendulo",
  centro: "concept-o-centro-do-pendulo",
  entrega: "concept-a-entrega-do-poder",
  sequestro: "concept-o-sequestro-da-identidade-pelo-contexto",
};

const concepts = [
  // ----- as três dimensões da ECP -----
  {
    _id: D.identidade,
    _type: "concept",
    group: "dimension",
    order: 1,
    title: tri("Identidade", "Identity", "Identidad"),
    slug: slug("identidade"),
    shortDefinition: tri(
      "A capacidade de reconhecer quem você é e confiar na própria experiência, sem depender continuamente da confirmação externa.",
      "The capacity to recognize who you are and to trust your own experience, without depending continuously on external confirmation.",
      "La capacidad de reconocer quién eres y confiar en tu propia experiencia, sin depender continuamente de la confirmación externa.",
    ),
    relatedConcepts: [refKeyed(V.serPoder), refKeyed(V.entrega), refKeyed(V.sequestro)],
  },
  {
    _id: D.contexto,
    _type: "concept",
    group: "dimension",
    order: 2,
    title: tri("Contexto", "Context", "Contexto"),
    slug: slug("contexto"),
    shortDefinition: tri(
      "A compreensão das forças, relações e ambientes que influenciam a forma como você se percebe e exerce sua potência.",
      "The understanding of the forces, relationships and environments that shape how you perceive yourself and exercise your potency.",
      "La comprensión de las fuerzas, relaciones y ambientes que influyen en la forma en que te percibes y ejerces tu potencia.",
    ),
    relatedConcepts: [refKeyed(V.sequestro), refKeyed(D.identidade)],
  },
  {
    _id: D.movimento,
    _type: "concept",
    group: "dimension",
    order: 3,
    title: tri("Movimento", "Movement", "Movimiento"),
    slug: slug("movimento"),
    shortDefinition: tri(
      "A capacidade de transformar consciência em escolha e escolha em ação, sem ser conduzido automaticamente pelo contexto.",
      "The capacity to turn awareness into choice and choice into action, without being driven automatically by the context.",
      "La capacidad de transformar consciencia en elección y elección en acción, sin ser conducido automáticamente por el contexto.",
    ),
    relatedConcepts: [refKeyed(V.centro), refKeyed(V.pendulo)],
  },

  // ----- o vocabulário Ser Poder -----
  {
    _id: V.terPoder,
    _type: "concept",
    group: "vocabulary",
    order: 1,
    // "Ter Poder" e "Ser Poder" são termos autorais: ficam em português nos 3 idiomas.
    title: tri("Ter Poder", "Ter Poder", "Ter Poder"),
    slug: slug("ter-poder"),
    shortDefinition: tri(
      "A potência condicionada a algo que precisamos ter, manter ou receber.",
      "Potency conditioned on something we need to have, keep or receive.",
      "La potencia condicionada a algo que necesitamos tener, mantener o recibir.",
    ),
    relatedConcepts: [refKeyed(V.serPoder), refKeyed(V.entrega)],
  },
  {
    _id: V.serPoder,
    _type: "concept",
    group: "vocabulary",
    order: 2,
    title: tri("Ser Poder", "Ser Poder", "Ser Poder"),
    slug: slug("ser-poder"),
    shortDefinition: tri(
      "A potência que não depende daquilo que temos para reconhecermos quem somos.",
      "The potency that does not depend on what we have for us to recognize who we are.",
      "La potencia que no depende de aquello que tenemos para reconocer quiénes somos.",
    ),
    relatedConcepts: [refKeyed(V.terPoder), refKeyed(D.identidade), refKeyed(V.centro)],
  },
  {
    _id: V.pendulo,
    _type: "concept",
    group: "vocabulary",
    order: 3,
    title: tri("O Pêndulo", "The Pendulum", "El Péndulo"),
    slug: slug("o-pendulo"),
    shortDefinition: tri(
      "O movimento entre extremos que parecem nos fortalecer, mas nos mantêm dependentes deles.",
      "The movement between extremes that seem to strengthen us, while keeping us dependent on them.",
      "El movimiento entre extremos que parecen fortalecernos, pero nos mantienen dependientes de ellos.",
    ),
    relatedConcepts: [refKeyed(V.centro), refKeyed(D.movimento)],
  },
  {
    _id: V.centro,
    _type: "concept",
    group: "vocabulary",
    order: 4,
    title: tri(
      "O Centro do Pêndulo",
      "The Center of the Pendulum",
      "El Centro del Péndulo",
    ),
    slug: slug("o-centro-do-pendulo"),
    shortDefinition: tri(
      "O lugar psicológico a partir do qual sentimos, escolhemos e agimos sem sermos arrastados pelos extremos.",
      "The psychological place from which we feel, choose and act without being dragged by the extremes.",
      "El lugar psicológico desde el cual sentimos, elegimos y actuamos sin ser arrastrados por los extremos.",
    ),
    relatedConcepts: [refKeyed(V.pendulo), refKeyed(D.movimento), refKeyed(V.serPoder)],
  },
  {
    _id: V.entrega,
    _type: "concept",
    group: "vocabulary",
    order: 5,
    title: tri(
      "A Entrega do Poder",
      "The Surrender of Power",
      "La Entrega del Poder",
    ),
    slug: slug("a-entrega-do-poder"),
    shortDefinition: tri(
      "O momento em que algo externo passa a determinar nosso valor, nossa estabilidade ou nossa capacidade de agir.",
      "The moment when something external starts to determine our worth, our stability or our capacity to act.",
      "El momento en que algo externo pasa a determinar nuestro valor, nuestra estabilidad o nuestra capacidad de actuar.",
    ),
    relatedConcepts: [refKeyed(V.terPoder), refKeyed(D.identidade)],
  },
  {
    _id: V.sequestro,
    _type: "concept",
    group: "vocabulary",
    order: 6,
    title: tri(
      "O Sequestro da Identidade pelo Contexto",
      "The Hijacking of Identity by Context",
      "El Secuestro de la Identidad por el Contexto",
    ),
    slug: slug("o-sequestro-da-identidade-pelo-contexto"),
    shortDefinition: tri(
      "Quando o contexto deixa de apenas nos influenciar e passa a julgar e organizar nossa experiência interna.",
      "When the context stops merely influencing us and starts judging and organizing our inner experience.",
      "Cuando el contexto deja de solo influirnos y pasa a juzgar y organizar nuestra experiencia interna.",
    ),
    relatedConcepts: [refKeyed(D.contexto), refKeyed(D.identidade)],
  },
];

// ----------------------------------------------------- remapeamento manual
// Um por um, a partir do título de cada documento publicado. É uma leitura
// editorial minha: a Andrea pode ajustar qualquer vínculo pelo Studio.
const remap = {
  // artigos
  "5cb9c84f-f709-4312-8865-294c19c9258b": [D.movimento, D.contexto], // capacidade de focar
  "6f59d82e-e040-412b-80f0-5bda941f48a6": [V.pendulo, V.centro, D.movimento], // pêndulo caos/conforto
  "703e0e37-eb72-4d34-b8f3-a2edc3c5aa64": [V.pendulo, D.identidade, D.contexto], // CLT ou empreendedorismo
  "8cef2c0b-38bd-4b4d-8ce1-6092d24a3fa2": [D.identidade, D.movimento], // coragem e fragilidade
  "article-neurociencia-da-validacao": [V.entrega, D.identidade],

  // casos
  "case-chefe-que-nunca-reconhece": [V.sequestro, V.entrega, D.contexto],
  "case-controlador-que-chama-controle-de-ajuda": [V.terPoder, V.pendulo, D.contexto],

  // perguntas
  "0340a18b-4fd8-4f4c-854c-fa780005e7ee": [D.identidade, D.movimento], // mudar de carreira é um luto
  "19e768ba-2d7b-4d85-990d-21f538761373": [V.pendulo, D.contexto, D.movimento], // limites e liberdade no casal
  "222f0014-3ae9-487d-8a92-f7c6391ba39b": [D.contexto, D.movimento], // idade para celular/redes
  "324e6b6d-fd86-4102-91b0-15cd2efbe475": [D.contexto, V.sequestro], // tanque de tubarões
  "33b05168-9bec-407d-bcc6-d1a207af7892": [V.centro, D.contexto], // alívio da meditação
  "804b1874-8ad5-4649-a0f9-79d16a2eef36": [V.pendulo, V.centro], // vida corrida x busca espiritual
  "89c57fa1-c7dc-4601-adf4-1dcab08985f0": [V.terPoder, V.serPoder, D.movimento], // limites aos filhos
  "8ff3c0f6-e33c-4fa6-8a0a-19148caa779d": [D.identidade, D.movimento], // nomear o que sinto
  "9579fcf5-c33e-4a39-93ab-77ad0cc020bf": [V.pendulo, V.centro], // liberdade e limites na criação
  "96174a32-1888-4fd9-94b6-665287b65509": [D.contexto, D.movimento], // tarefas no casal
  "adda602a-9610-416e-8d88-61fc27b598be": [D.identidade, V.serPoder], // vulnerabilidade é fraqueza
  "e44a06be-394e-4da6-abe4-d136f309d81a": [V.entrega, D.identidade], // reconhecimento no outro
  "e8ebf006-3f6d-4fbc-b109-1f98553c4793": [V.serPoder, D.contexto], // bom pai/mãe e bom líder
  "question-chefe-que-me-diminui": [V.sequestro, V.entrega, D.contexto],
  "question-parar-de-buscar-validacao": [V.entrega, D.identidade],
  "question-recuperar-confianca": [D.identidade, V.serPoder],
  "question-vazia-apesar-do-sucesso": [V.terPoder, V.serPoder, V.entrega],

  // vídeos
  "0a42f748-1f31-4da0-99f0-d740e899c60f": [V.pendulo, V.centro], // liberdade ou limites
  "4b64d328-e7de-43b9-9ebf-6c97792c83ef": [V.pendulo, D.identidade, D.contexto], // largar a CLT
  "6b9b61f8-3779-4168-aa3f-32dbf6ce24f9": [V.pendulo, V.centro, D.movimento], // equilibrar no pêndulo
  "975d218e-f4f6-4d5a-a098-f8efa3a80bf8": [D.identidade, D.contexto, V.serPoder], // vulnerabilidade é fraqueza
};

const OLD_IDS = [
  "concept-poder-consciente",
  "concept-lideranca",
  "concept-posicionamento",
  "concept-comportamento-humano",
  "concept-estrutura-consciente-de-poder",
];

// Quem ainda aponta para os conceitos antigos (rascunhos incluídos)? O que não
// está no mapa manual entra na limpeza residual.
const referencing = await client.fetch(
  `*[references($old)]{_id, _type}`,
  { old: OLD_IDS },
);
const leftovers = referencing.filter(
  (d) => !Object.prototype.hasOwnProperty.call(remap, d._id),
);

const tx = client.transaction();

for (const doc of concepts) tx.createOrReplace(doc);

// Só reponta documentos que existem de fato (evita derrubar a transação se
// algum tiver sido apagado no Studio depois deste mapa ter sido escrito).
const existing = new Set(
  await client.fetch(`*[_id in $ids]._id`, { ids: Object.keys(remap) }),
);
for (const [id, conceptIds] of Object.entries(remap)) {
  if (!existing.has(id)) {
    console.warn(`  aviso: ${id} não existe mais — pulei`);
    continue;
  }
  tx.patch(id, (p) => p.set({ relatedConcepts: conceptIds.map(refKeyed) }));
}

// Residuais: remove só as referências aos conceitos antigos, preserva o resto.
for (const doc of leftovers) {
  tx.patch(doc._id, (p) =>
    p.unset(OLD_IDS.map((old) => `relatedConcepts[_ref=="${old}"]`)),
  );
}

for (const id of OLD_IDS) tx.delete(id);

const res = await tx.commit();
console.log("OK — transação aplicada:", res.transactionId);
console.log(`  conceitos criados/atualizados: ${concepts.length}`);
console.log(`  documentos repontados: ${Object.keys(remap).length}`);
console.log(
  `  documentos com referência residual limpa: ${leftovers.length}` +
    (leftovers.length ? ` (${leftovers.map((d) => d._id).join(", ")})` : ""),
);
console.log(`  conceitos antigos apagados: ${OLD_IDS.length}`);
