/**
 * Gera o cartão de compartilhamento (Open Graph / Twitter) em
 * `public/brand/og-andrea-eboli.jpg` — 1200x630, o tamanho que WhatsApp,
 * LinkedIn e X esperam.
 *
 * Monta só com material que já é da marca: o fundo vinho da paleta, a
 * assinatura real (logo em creme) e o retrato de 2026. JPG de propósito: o
 * suporte a WebP nos raspadores de link ainda é irregular.
 *
 * Uso: node gera-og-image.mjs
 */
import sharp from "sharp";
import { promises as fs } from "node:fs";

const W = 1200;
const H = 630;
const WINE = "#41181e";
const CREAM = "#ece2d3";

const RETRATO = "public/brand/andrea-eboli-retrato-2026.webp";
const LOGO = "public/brand/logo-andrea-eboli-cream.webp";
const OUT = "public/brand/og-andrea-eboli.jpg";

// O retrato ocupa a metade direita; o rosto está no terço superior da foto,
// então o recorte puxa para cima (position: top) para não cortar a cabeça.
const larguraFoto = Math.round(W * 0.46);
const foto = await sharp(RETRATO)
  .resize({ width: larguraFoto, height: H, fit: "cover", position: "top" })
  .toBuffer();

// Assinatura em creme, centrada na metade esquerda.
const larguraLogo = 520;
const logo = await sharp(LOGO)
  .resize({ width: larguraLogo, withoutEnlargement: true })
  .toBuffer();
const { height: alturaLogo } = await sharp(logo).metadata();

// Véu que amacia a borda entre a foto e o fundo, sem cortar a imagem.
const veu = Buffer.from(
  `<svg width="${larguraFoto}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${WINE}" stop-opacity="0.95"/>
        <stop offset="0.28" stop-color="${WINE}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="${larguraFoto}" height="${H}" fill="url(#fade)"/>
  </svg>`,
);

const texto = Buffer.from(
  `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <text x="96" y="${Math.round(H / 2) + alturaLogo / 2 + 74}"
      font-family="Georgia, 'Times New Roman', serif" font-size="40"
      font-style="italic" fill="${CREAM}" fill-opacity="0.92">Ser Poder</text>
    <text x="96" y="${Math.round(H / 2) + alturaLogo / 2 + 122}"
      font-family="Helvetica, Arial, sans-serif" font-size="19"
      letter-spacing="3.4" fill="${CREAM}" fill-opacity="0.6">PESQUISADORA · CRIADORA DA ECP</text>
  </svg>`,
);

await sharp({ create: { width: W, height: H, channels: 3, background: WINE } })
  .composite([
    { input: foto, left: W - larguraFoto, top: 0 },
    { input: veu, left: W - larguraFoto, top: 0 },
    { input: logo, left: 96, top: Math.round((H - alturaLogo) / 2) - 40 },
    { input: texto, left: 0, top: 0 },
  ])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(OUT);

const { size } = await fs.stat(OUT);
console.log(`${OUT}  ${W}x${H}  ${(size / 1024).toFixed(0)}kB`);
