/*
  Remove o sufixo aleatório (-xxxxx) dos slugs dos vídeos publicados,
  desde que o slug limpo não colida com outro documento do mesmo tipo.

  Rodar:  npx sanity exec clean-video-slugs.mjs --with-user-token
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

const videos = await client.fetch(
  `*[_type == "video" && defined(slug.current)]{ _id, "slug": slug.current }`,
);
const allSlugs = new Set(videos.map((v) => v.slug));

const tx = client.transaction();
let changed = 0;
for (const v of videos) {
  const clean = v.slug.replace(/-[a-z0-9]{5}$/, "");
  if (clean === v.slug) continue; // já é limpo
  if (allSlugs.has(clean)) {
    console.log(`PULADO (colisão): ${v.slug}`);
    continue;
  }
  tx.patch(v._id, (p) => p.set({ "slug.current": clean }));
  allSlugs.add(clean);
  changed++;
  console.log(`${v.slug}  →  ${clean}`);
}

if (changed === 0) {
  console.log("Nada a mudar.");
} else {
  const res = await tx.commit();
  console.log(`OK — ${changed} slug(s) atualizados. Transação: ${res.transactionId}`);
}
