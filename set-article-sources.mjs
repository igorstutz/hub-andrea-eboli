// Preenche o campo `source` (fonte) dos artigos que já existiam antes da
// mudança de 06/08/2026 — ele virou o filtro da biblioteca de artigos.
//
// Como rodar (sessão do CLI do dono, sem token de escrita):
//   npx sanity exec set-article-sources.mjs --with-user-token
//
// Só mexe em artigos SEM `source`. Rodar de novo é seguro (idempotente).
// Ajuste o mapa abaixo se a origem de algum artigo for outra.

import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2024-10-01" });

// _id do artigo → fonte. "original" = escrito direto no Studio.
const SOURCE_BY_ID = {
  // gerados pela importação de vídeos do YouTube
  "8cef2c0b-38bd-4b4d-8ce1-6092d24a3fa2": "youtube",
  "703e0e37-eb72-4d34-b8f3-a2edc3c5aa64": "youtube",
  // veio do seed de exemplo
  "article-neurociencia-da-validacao": "original",
};

const FALLBACK = "original";

// A consulta traz publicados E rascunhos (`drafts.<id>`): o rascunho é o mesmo
// artigo, então a fonte tem de ser resolvida pelo id BASE.
const baseId = (id) => id.replace(/^drafts\./, "");

const articles = await client.fetch(
  `*[_type == "article"]{_id, "title": title.pt, source}`,
);

const pending = articles.filter((a) => {
  const mapped = SOURCE_BY_ID[baseId(a._id)];
  // Sem fonte → preenche. Com fonte divergente do mapa → corrige (o mapa é a
  // verdade desta migração). Fora do mapa e já preenchido → não mexe.
  return mapped ? a.source !== mapped : !a.source;
});

if (!pending.length) {
  console.log("Nada a fazer: todos os artigos já têm a fonte correta.");
  process.exit(0);
}

const tx = client.transaction();
for (const a of pending) {
  const source = SOURCE_BY_ID[baseId(a._id)] ?? FALLBACK;
  const isDraft = a._id.startsWith("drafts.");
  console.log(
    `· ${source.padEnd(9)} ← ${a.title}${isDraft ? "  (rascunho)" : ""}`,
  );
  tx.patch(a._id, (p) => p.set({ source }));
}
await tx.commit();
console.log(`\n✓ ${pending.length} artigo(s) atualizado(s).`);
