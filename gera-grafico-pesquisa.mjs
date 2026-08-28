/**
 * Gera o gráfico principal da /pesquisa em `public/pesquisa/`, um por idioma.
 *
 * Os dados são da pergunta 20 da Pesquisa ECP ("quais destas ideias você mais
 * associa a poder", até 3 respostas, base 403) e foram lidos direto do
 * `ppt/charts/chart12.xml` do deck original, não digitados à mão.
 *
 * O gráfico existe para mostrar uma coisa só: as quatro ideias mais associadas
 * a poder são todas externas, e as internas aparecem muito abaixo. Por isso as
 * barras são pintadas em duas famílias (vinho = externo, verde = interno).
 *
 * ⚠️ A marca d'água é GRAVADA no arquivo de propósito. Marca d'água por CSS é
 * só atrito: quem quiser baixa a imagem original.
 *
 * Uso: node gera-grafico-pesquisa.mjs
 */
import sharp from "sharp";
import { promises as fs } from "node:fs";

const W = 1600;
const H = 1080;
const WINE = "#41181e";
const WINE_SOFT = "#6b2a32";
const GREEN = "#14312c";
const BONE = "#f4eee0";
const INK = "#2b2320";

// Percentuais da P20 (base 403). Ordem: as 4 externas, depois as 4 internas.
const VALORES = [54.8, 46.9, 42.9, 34.5, 15.4, 14.9, 8.9, 7.9];
const EXTERNAS = 4;

const TEXTOS = {
  pt: {
    titulo: "O que as pessoas chamam de poder",
    subtitulo: "Ideias mais associadas a poder, até três respostas por pessoa",
    externo: "Poder externo",
    interno: "Poder interno",
    itens: [
      "Ter controle ou poder de decisão",
      "Ter influência sobre outras pessoas",
      "Ter dinheiro ou recursos",
      "Ter posição, cargo ou status",
      "Ter clareza sobre quem se é",
      "Agir a partir das próprias escolhas",
      "Saber ler situações com clareza",
      "Conseguir se sustentar emocionalmente",
    ],
    nota: "Base: 403 respondentes · Pesquisa ECP, 2026",
  },
  en: {
    titulo: "What people call power",
    subtitulo: "Ideas most associated with power, up to three answers per person",
    externo: "External power",
    interno: "Inner power",
    itens: [
      "Having control or decision power",
      "Having influence over other people",
      "Having money or resources",
      "Having a position, title or status",
      "Having clarity about who you are",
      "Acting from your own choices",
      "Reading situations clearly",
      "Sustaining yourself emotionally",
    ],
    nota: "Base: 403 respondents · ECP Research, 2026",
  },
  es: {
    titulo: "Lo que las personas llaman poder",
    subtitulo: "Ideas más asociadas al poder, hasta tres respuestas por persona",
    externo: "Poder externo",
    interno: "Poder interno",
    itens: [
      "Tener control o poder de decisión",
      "Tener influencia sobre otras personas",
      "Tener dinero o recursos",
      "Tener posición, cargo o estatus",
      "Tener claridad sobre quién se es",
      "Actuar desde las propias elecciones",
      "Saber leer las situaciones con claridad",
      "Poder sostenerse emocionalmente",
    ],
    nota: "Base: 403 respondentes · Investigación ECP, 2026",
  },
};

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Vírgula decimal em pt/es, ponto em en.
const numero = (v, locale) =>
  locale === "en" ? `${v.toFixed(1)}%` : `${v.toFixed(1).replace(".", ",")}%`;

function svg(locale) {
  const t = TEXTOS[locale];
  const ESQ = 560; // onde as barras começam (espaço para os rótulos)
  const DIR = 175; // espaço à direita para o valor
  const ALTURA_LINHA = 76;
  const ALTURA_BARRA = 38;
  const larguraMax = W - ESQ - DIR;
  const escala = larguraMax / 60; // 60% cobre a maior barra com folga

  // Cada família ganha um cabeçalho próprio ANTES das suas barras, para o
  // rótulo não disputar espaço com o nome de cada ideia.
  const GRUPOS = [
    { titulo: t.externo, cor: WINE, de: 0, ate: EXTERNAS, opacidade: 0.92 },
    { titulo: t.interno, cor: GREEN, de: EXTERNAS, ate: VALORES.length, opacidade: 0.78 },
  ];

  let y = 232;
  const partes = [];
  for (const g of GRUPOS) {
    partes.push(`
      <text x="44" y="${y}" font-family="Helvetica, Arial, sans-serif"
        font-size="21" letter-spacing="3" fill="${g.cor}" fill-opacity="0.85">${esc(g.titulo.toUpperCase())}</text>
      <line x1="44" y1="${y + 18}" x2="${W - 44}" y2="${y + 18}" stroke="${g.cor}" stroke-opacity="0.18" stroke-width="2"/>`);
    y += 48;
    for (let i = g.de; i < g.ate; i++) {
      const largura = Math.round(VALORES[i] * escala);
      partes.push(`
        <text x="${ESQ - 26}" y="${y + ALTURA_BARRA / 2 + 7}" text-anchor="end"
          font-family="Helvetica, Arial, sans-serif" font-size="28"
          fill="${INK}" fill-opacity="${g.opacidade}">${esc(t.itens[i])}</text>
        <rect x="${ESQ}" y="${y}" width="${largura}" height="${ALTURA_BARRA}" rx="6" fill="${g.cor}"/>
        <text x="${ESQ + largura + 18}" y="${y + ALTURA_BARRA / 2 + 8}"
          font-family="Georgia, 'Times New Roman', serif" font-size="33" font-weight="bold"
          fill="${g.cor}">${numero(VALORES[i], locale)}</text>`);
      y += ALTURA_LINHA;
    }
    y += 30;
  }
  const barras = partes.join("");

  // Marca d'água gravada: diagonal discreta o bastante para não competir com a
  // leitura dos dados, mas presente no arquivo.
  const diagonais = [0, 1, 2]
    .map(
      (i) =>
        `<text x="${150 + i * 500}" y="${975 - i * 100}" transform="rotate(-22 ${150 + i * 500} ${975 - i * 100})"
          font-family="Georgia, 'Times New Roman', serif" font-size="52" font-style="italic"
          fill="${WINE}" fill-opacity="0.04">andreaeboli.com</text>`,
    )
    .join("");

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${BONE}"/>
    ${diagonais}
    <rect x="0" y="0" width="${W}" height="6" fill="${WINE}"/>
    <text x="44" y="112" font-family="Georgia, 'Times New Roman', serif" font-size="62"
      fill="${WINE}">${esc(t.titulo)}</text>
    <text x="44" y="164" font-family="Helvetica, Arial, sans-serif" font-size="28"
      fill="${INK}" fill-opacity="0.62">${esc(t.subtitulo)}</text>
    ${barras}
    <line x1="44" y1="${H - 92}" x2="${W - 44}" y2="${H - 92}" stroke="${INK}" stroke-opacity="0.12" stroke-width="2"/>
    <text x="44" y="${H - 50}" font-family="Helvetica, Arial, sans-serif" font-size="24"
      fill="${INK}" fill-opacity="0.58">${esc(t.nota)}</text>
    <text x="${W - 44}" y="${H - 50}" text-anchor="end" font-family="Georgia, 'Times New Roman', serif"
      font-size="27" font-style="italic" fill="${WINE_SOFT}" fill-opacity="0.9">Andrea Eboli</text>
  </svg>`;
}

await fs.mkdir("public/pesquisa", { recursive: true });
for (const locale of Object.keys(TEXTOS)) {
  const out = `public/pesquisa/pesquisa-ecp-o-que-e-poder-${locale}.webp`;
  await sharp(Buffer.from(svg(locale)), { density: 144 })
    .resize(W, H)
    .webp({ quality: 92 })
    .toFile(out);
  const { size } = await fs.stat(out);
  console.log(`${out}  ${W}x${H}  ${(size / 1024).toFixed(0)}kB`);
}
