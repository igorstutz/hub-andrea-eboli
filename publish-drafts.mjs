/*
  Publica TODOS os rascunhos (drafts.*) do dataset.

  Uso (sessão do Sanity CLI — conta de dono):
    npx sanity exec publish-drafts.mjs --with-user-token

  Para cada rascunho: cria a versão publicada (mesmo conteúdo, _id sem o prefixo
  "drafts.") e remove o rascunho. Tudo numa única transação — atômico e resolve
  as referências fracas entre os documentos.
*/

const apiVersion = "2024-10-01";
const { getCliClient } = await import("sanity/cli");
const client = getCliClient({ apiVersion });

const drafts = await client.fetch('*[_id in path("drafts.**")]');

if (!drafts.length) {
  console.log("Nenhum rascunho encontrado. Nada a publicar.");
  process.exit(0);
}

console.log(`Encontrados ${drafts.length} rascunho(s):`);
for (const d of drafts) {
  const title = d.title?.pt || d.title || "(sem título)";
  console.log(`  - [${d._type}] ${title}  (${d._id})`);
}

const tx = client.transaction();
for (const d of drafts) {
  const publishedId = d._id.replace(/^drafts\./, "");
  // Remove campos de sistema do rascunho antes de publicar.
  const { _id, _rev, _createdAt, _updatedAt, ...rest } = d;
  void _id;
  void _rev;
  void _createdAt;
  void _updatedAt;
  tx.createOrReplace({ ...rest, _id: publishedId });
  tx.delete(d._id);
}

await tx.commit();
console.log(`\n✓ Publicados ${drafts.length} documento(s). Rascunhos removidos.`);
