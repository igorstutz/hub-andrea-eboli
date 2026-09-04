/**
 * Cria o verbete "Liderança Consciente" no vocabulário Ser Poder.
 *
 * Pedido do Igor em 04/09/2026: "liderança consciente entra nos conceitos de
 * ser poder (aparece na home também)". Como a home lê a biblioteca de
 * conceitos e separa os blocos pelo campo `group`, basta o documento existir
 * com `group: "vocabulary"` para ele aparecer na seção "O vocabulário Ser
 * Poder" e ganhar a própria página em /conceitos/lideranca-consciente.
 *
 * 🔴 A DEFINIÇÃO CURTA AQUI É MINHA, NÃO DELA.
 * Os outros 9 conceitos têm `shortDefinition` copiada das palavras da Andrea
 * (documento "INPUTS SITE", 19/08/2026). Para este termo não recebi texto, e
 * deixar o campo vazio quebraria o cartão na home. Então escrevi uma frase no
 * registro dela — estrutural, uma frase só, nomeando as três dimensões da ECP
 * sem listá-las mecanicamente — para ela revisar. **Precisa de aprovação.**
 *
 * `fullDefinition` fica VAZIA de propósito, como nos outros 9: é conteúdo
 * autoral que só ela escreve, pelo Studio.
 *
 * Uso: npx sanity exec add-conceito-lideranca-consciente.mjs --with-user-token
 */
import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2024-10-01" });

const SLUG = "lideranca-consciente";
const ID = `concept-${SLUG}`;

const doc = {
  _id: ID,
  _type: "concept",
  title: {
    _type: "localeString",
    // "Ter Poder" e "Ser Poder" ficam em português nos 3 idiomas porque são o
    // par autoral da tese. "Liderança Consciente" não é: como os outros 4
    // verbetes e as 3 dimensões, é traduzido.
    pt: "Liderança Consciente",
    en: "Conscious Leadership",
    es: "Liderazgo Consciente",
  },
  slug: { _type: "slug", current: SLUG },
  group: "vocabulary",
  // Os 6 verbetes existentes vão de 1 a 6; este entra no fim do bloco.
  order: 7,
  shortDefinition: {
    _type: "localeText",
    pt: "A capacidade de conduzir a partir de quem se é, e não do cargo que se ocupa: clareza sobre a própria identidade, leitura do contexto e ação coerente entre as duas.",
    en: "The capacity to lead from who you are rather than from the position you hold: clarity about your own identity, a reading of the context, and action coherent with both.",
    es: "La capacidad de conducir desde quien se es, y no desde el cargo que se ocupa: claridad sobre la propia identidad, lectura del contexto y acción coherente con ambas.",
  },
};

const existente = await client.fetch(`*[_type=="concept" && slug.current==$s][0]{_id}`, {
  s: SLUG,
});

if (existente) {
  console.log(`Já existe (${existente._id}). Nada foi alterado.`);
} else {
  const criado = await client.create(doc);
  console.log(`Criado: ${criado._id}`);
}

const vocab = await client.fetch(
  `*[_type=="concept" && group=="vocabulary"]{ "t":title.pt, order } | order(coalesce(order,999) asc)`,
);
console.log("\nVocabulário Ser Poder agora:");
for (const c of vocab) console.log(`  ${String(c.order ?? "-").padStart(2)}  ${c.t}`);
