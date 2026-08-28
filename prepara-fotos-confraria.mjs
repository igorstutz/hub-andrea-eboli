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
 * Ficaram DE FORA do lote (3 de 19):
 *   - 21.24.32: print de story do Instagram (interface e @ sobrepostos).
 *   - 21.24.40 (1) e (2): retratos da Andrea com a marca d'água do fotógrafo
 *     ("GIT Ikeda"). São da MESMA sessão do retrato que já está no site
 *     (public/brand/andrea-eboli-retrato-2026.webp): mesmo sofá, mesmo quadro
 *     e mesma roupa. Ou seja, só falta o arquivo limpo, sem a marca.
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
    "WhatsApp Image 2026-08-20 at 21.24.40.jpeg",
    "confraria-lets-be-grupo-participantes-encontro",
  ],
  [
    "WhatsApp Image 2026-08-20 at 21.24.37 (1).jpeg",
    "confraria-lets-be-participantes-camisetas-better-humans",
  ],
  [
    "WhatsApp Image 2026-08-20 at 21.24.36 (1).jpeg",
    "confraria-lets-be-mesa-de-conversa-noturna",
  ],
  [
    "WhatsApp Image 2026-08-20 at 21.24.37 (2).jpeg",
    "confraria-lets-be-jantar-do-encontro",
  ],
  [
    "WhatsApp Image 2026-08-20 at 21.24.35.jpeg",
    "confraria-lets-be-selfie-participantes-jantar",
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
    "WhatsApp Image 2026-08-20 at 21.24.34.jpeg",
    "confraria-lets-be-grupo-reunido-no-salao-do-encontro",
  ],
  [
    "WhatsApp Image 2026-08-20 at 21.24.36.jpeg",
    "confraria-lets-be-participantes-tirando-selfie",
  ],
  [
    "WhatsApp Image 2026-08-20 at 21.24.37.jpeg",
    "confraria-lets-be-dupla-de-participantes-no-painel-de-arvores",
  ],
  [
    "WhatsApp Image 2026-08-20 at 21.24.40 (3).jpeg",
    "confraria-lets-be-brinde-camisetas-na-cesta-de-palha",
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
