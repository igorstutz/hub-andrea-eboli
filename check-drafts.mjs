// Diagnóstico: conta rascunhos e publicados. Uso:
//   npx sanity exec check-drafts.mjs --with-user-token
const apiVersion = "2024-10-01";
const { getCliClient } = await import("sanity/cli");
const client = getCliClient({ apiVersion });

const drafts = await client.fetch('*[_id in path("drafts.**")]{_type, _id, "t": coalesce(title.pt, title)}');
const videos = await client.fetch('*[_type=="video" && !(_id in path("drafts.**"))]{"slug": slug.current, "t": title.pt}');

console.log(`RASCUNHOS (${drafts.length}):`);
for (const d of drafts) console.log(`  - [${d._type}] ${d.t ?? "(sem título)"}  ${d._id}`);
console.log(`\nVÍDEOS PUBLICADOS (${videos.length}):`);
for (const v of videos) console.log(`  - ${v.t}  (/videos/${v.slug})`);
