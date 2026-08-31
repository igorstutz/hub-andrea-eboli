/**
 * Prepara as fotos da /confraria a partir do lote que a Andrea mandou pelo
 * WhatsApp (`Downloads/andrea imagens/confraria`).
 *
 * - guarda o original (renomeado) em `../brand-originais/confraria/`
 * - gera o .webp leve em `public/confraria/`
 *
 * Os nomes de arquivo são escritos para SEO: minúsculas, hifens e as
 * palavras-chave da marca (andrea eboli / confraria lets be). Os alts moram no
 * i18n (`confrariaPage.photo*Alt` nos 3 idiomas).
 *
 * Este arquivo é a MEMÓRIA DA CURADORIA: 19 fotos no lote, 10 publicadas.
 *
 * Ficaram de fora por DIREITO DE IMAGEM ou por serem print (3):
 *   - 21.24.32: print de story do Instagram (interface e @ sobrepostos).
 *   - 21.24.40 (1) e (2): retratos da Andrea com a marca d'água do fotógrafo
 *     ("GIT Ikeda"). São da MESMA sessão do retrato que já está no site
 *     (public/brand/andrea-eboli-retrato-2026.webp): mesmo sofá, mesmo quadro
 *     e mesma roupa. Ou seja, só falta o arquivo limpo, sem a marca.
 *
 * Ficaram de fora por REPETIÇÃO ou ENQUADRAMENTO (6) — corte de 31/08/2026,
 * pedido da Andrea ("tem fotos da confraria repetidas", "umas
 * desconfiguradas"). Em cada par, a foto que ficou está anotada:
 *   - 21.24.40 (3) cesta de camisetas: mesma cesta, mesmas camisetas e mesmas
 *     etiquetas de `camisetas-lets-be-better-humans`, que ficou por estar mais
 *     bem iluminada.
 *   - 21.24.40 grupo com os braços erguidos: mesmo grupo, mesma sala e mesma
 *     roupa de `foto-oficial-do-grupo`, dois cliques do mesmo instante.
 *   - 21.24.34 grupo no salão: mesmo grupo diante do mesmo painel de árvores
 *     de `participantes-camisetas-better-humans`, que ficou por mostrar todo
 *     mundo e o salão.
 *   - 21.24.36 (1) mesa noturna: repete a mesa de `jantar-do-encontro` e o
 *     aparelho de ar-condicionado ocupa o terço superior do quadro.
 *   - 21.24.35 selfie no jantar: repete o grupo com as sacolas de
 *     `participantes-sacolas-lets-be-real`, com um rosto desfocado tomando um
 *     terço do quadro na frente.
 *   - 21.24.36 duas participantes tirando selfie: era a TERCEIRA foto de dupla
 *     diante do painel de árvores. Com as três, o mosaico mostrava a mesma
 *     cena três vezes lado a lado. Ficaram as duas melhores: `abraco-
 *     participante` (com a Andrea) e `dupla-de-participantes-no-painel`. Esta
 *     também era a de enquadramento mais fraco das três (muito piso vazio e
 *     uma cadeira cortada no canto).
 *
 * Uso: node prepara-fotos-confraria.mjs
 */
import sharp from "sharp";
import { promises as fs } from "node:fs";
import path from "node:path";

const SRC = "C:/Users/igors/Downloads/andrea imagens/confraria";
const ORIG = "../brand-originais/confraria";
const PUB = "public/confraria";

const MAP = [
  [
    "WhatsApp Image 2026-08-20 at 21.24.39 (1).jpeg",
    "andrea-eboli-confraria-lets-be-roda-de-conversa",
  ],
  [
    "WhatsApp Image 2026-08-20 at 21.24.39 (2).jpeg",
    "confraria-lets-be-foto-oficial-do-grupo",
  ],
  [
    "WhatsApp Image 2026-08-20 at 21.24.39.jpeg",
    "andrea-eboli-confraria-lets-be-conduzindo-conversa",
  ],
  [
    "WhatsApp Image 2026-08-20 at 21.24.37 (1).jpeg",
    "confraria-lets-be-participantes-camisetas-better-humans",
  ],
  [
    "WhatsApp Image 2026-08-20 at 21.24.37 (2).jpeg",
    "confraria-lets-be-jantar-do-encontro",
  ],
  [
    "WhatsApp Image 2026-08-20 at 21.24.35 (1).jpeg",
    "confraria-lets-be-participantes-sacolas-lets-be-real",
  ],
  [
    "WhatsApp Image 2026-08-20 at 21.24.38 (1).jpeg",
    "andrea-eboli-confraria-lets-be-com-participante",
  ],
  [
    "WhatsApp Image 2026-08-20 at 21.24.38 (2).jpeg",
    "andrea-eboli-confraria-lets-be-abraco-participante",
  ],
  [
    "WhatsApp Image 2026-08-20 at 21.24.38.jpeg",
    "confraria-lets-be-camisetas-lets-be-better-humans",
  ],
  [
    "WhatsApp Image 2026-08-20 at 21.24.37.jpeg",
    "confraria-lets-be-dupla-de-participantes-no-painel-de-arvores",
  ],
];

for (const [src, name] of MAP) {
  const from = path.join(SRC, src);
  await fs.copyFile(from, path.join(ORIG, `${name}.jpeg`));
  const img = sharp(from);
  const { width, height } = await img.metadata();
  const out = path.join(PUB, `${name}.webp`);
  await img
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toFile(out);
  const { size } = await fs.stat(out);
  console.log(
    `${name}.webp  ${width}x${height}  ${(size / 1024).toFixed(0)}kB`,
  );
}
