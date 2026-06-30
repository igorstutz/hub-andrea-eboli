// Conversores de texto puro / markdown leve para Portable Text (campos localeBlock).
//
// Suporte (nível de bloco) na v1: parágrafos, títulos (## / ###), citações (>),
// listas (- / * e 1.). Marcas inline (negrito/itálico) não são interpretadas —
// viram texto simples; a Andrea enriquece no Studio se quiser.

export type PortableBlock = {
  _type: "block";
  _key: string;
  style: string;
  listItem?: "bullet" | "number";
  level?: number;
  markDefs: never[];
  children: Array<{ _type: "span"; _key: string; text: string; marks: never[] }>;
};

let keyCounter = 0;
function nextKey(prefix = "k"): string {
  keyCounter += 1;
  return `${prefix}${keyCounter.toString(36)}${Date.now().toString(36).slice(-4)}`;
}

function makeBlock(
  text: string,
  style: string,
  listItem?: "bullet" | "number",
): PortableBlock {
  return {
    _type: "block",
    _key: nextKey("b"),
    style,
    ...(listItem ? { listItem, level: 1 } : {}),
    markDefs: [],
    children: [{ _type: "span", _key: nextKey("s"), text, marks: [] }],
  };
}

// Markdown leve -> blocos. Pensado para a saída do modelo.
export function markdownToPortableText(input?: string): PortableBlock[] {
  if (!input || !input.trim()) return [];
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const blocks: PortableBlock[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    const text = paragraph.join(" ").trim();
    if (text) blocks.push(makeBlock(text, "normal"));
    paragraph = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flush();
      continue;
    }
    if (line.startsWith("### ")) {
      flush();
      blocks.push(makeBlock(line.slice(4).trim(), "h3"));
    } else if (line.startsWith("## ")) {
      flush();
      blocks.push(makeBlock(line.slice(3).trim(), "h2"));
    } else if (line.startsWith("# ")) {
      flush();
      blocks.push(makeBlock(line.slice(2).trim(), "h2"));
    } else if (line.startsWith("> ")) {
      flush();
      blocks.push(makeBlock(line.slice(2).trim(), "blockquote"));
    } else if (/^[-*]\s+/.test(line)) {
      flush();
      blocks.push(makeBlock(line.replace(/^[-*]\s+/, "").trim(), "normal", "bullet"));
    } else if (/^\d+\.\s+/.test(line)) {
      flush();
      blocks.push(makeBlock(line.replace(/^\d+\.\s+/, "").trim(), "normal", "number"));
    } else {
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}

// Texto corrido (ex.: transcrição) -> parágrafos. Quebra em sentenças longas
// para não gerar um único bloco gigante.
export function textToPortableText(input?: string): PortableBlock[] {
  if (!input || !input.trim()) return [];
  const normalized = input.replace(/\s+/g, " ").trim();
  // Agrupa ~3 sentenças por parágrafo.
  const sentences = normalized.match(/[^.!?]+[.!?]+|\S+$/g) ?? [normalized];
  const blocks: PortableBlock[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    const chunk = sentences.slice(i, i + 3).join(" ").trim();
    if (chunk) blocks.push(makeBlock(chunk, "normal"));
  }
  return blocks;
}

// Slug a partir do título em PT (sem acentos, kebab-case).
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96)
    .replace(/-+$/g, "");
}
