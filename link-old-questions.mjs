/*
  Vincula aos conceitos-pilar as 6 perguntas da PRIMEIRA importação (24/06),
  criadas antes de a vinculação automática existir.

  Rodar:  npx sanity exec link-old-questions.mjs --with-user-token
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
const refKeyed = (id) => ({ _type: "reference", _ref: id, _key: `loq${k++}` });

// pergunta → conceitos pertinentes
const links = {
  // Limites e liberdade no casal
  "19e768ba-2d7b-4d85-990d-21f538761373": ["concept-posicionamento", "concept-comportamento-humano"],
  // Celular/redes para os filhos
  "222f0014-3ae9-487d-8a92-f7c6391ba39b": ["concept-comportamento-humano", "concept-lideranca"],
  // Limites ≠ autoritarismo
  "89c57fa1-c7dc-4601-adf4-1dcab08985f0": ["concept-lideranca", "concept-poder-consciente"],
  // Equilibrar liberdade e limites na criação
  "9579fcf5-c33e-4a39-93ab-77ad0cc020bf": ["concept-comportamento-humano", "concept-lideranca"],
  // Dividir tarefas no casal
  "96174a32-1888-4fd9-94b6-665287b65509": ["concept-posicionamento", "concept-comportamento-humano"],
  // Bom pai/mãe e bom líder
  "e8ebf006-3f6d-4fbc-b109-1f98553c4793": ["concept-lideranca", "concept-comportamento-humano"],
};

const tx = client.transaction();
for (const [qId, conceptIds] of Object.entries(links)) {
  tx.patch(qId, (p) => p.set({ relatedConcepts: conceptIds.map(refKeyed) }));
}

const res = await tx.commit();
console.log("OK — transação:", res.transactionId);
console.log(`Vinculadas: ${Object.keys(links).length} perguntas.`);
