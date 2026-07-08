/*
  Vincula o conteúdo existente (casos, artigos e vídeos) aos conceitos-pilar do hub.
  As perguntas já foram vinculadas pelo update-concepts.mjs.

  Rodar:  npx sanity exec link-concepts.mjs --with-user-token
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
const refKeyed = (id) => ({ _type: "reference", _ref: id, _key: `lc${k++}` });

// docId → conceitos
const links = {
  // Casos
  "case-chefe-que-nunca-reconhece": ["concept-lideranca", "concept-comportamento-humano"],
  "case-controlador-que-chama-controle-de-ajuda": ["concept-comportamento-humano", "concept-poder-consciente"],
  // Artigos
  "article-neurociencia-da-validacao": ["concept-comportamento-humano", "concept-poder-consciente"],
  "703e0e37-eb72-4d34-b8f3-a2edc3c5aa64": ["concept-posicionamento", "concept-poder-consciente"], // CLT ou empreendedorismo
  // Vídeos
  "4b64d328-e7de-43b9-9ebf-6c97792c83ef": ["concept-posicionamento", "concept-poder-consciente"], // Largar a CLT vale a pena?
  "0a42f748-1f31-4da0-99f0-d740e899c60f": ["concept-comportamento-humano", "concept-lideranca"], // Liberdade ou limites?
};

const tx = client.transaction();
for (const [docId, conceptIds] of Object.entries(links)) {
  tx.patch(docId, (p) => p.set({ relatedConcepts: conceptIds.map(refKeyed) }));
}

const res = await tx.commit();
console.log("OK — transação aplicada:", res.transactionId);
console.log(`Vinculados: ${Object.keys(links).length} documentos aos conceitos.`);
