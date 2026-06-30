import type { ReactNode } from "react";

// Ícones SVG inline (sem dependências) — um por biblioteca.
const ICONS: Record<string, ReactNode> = {
  // Perguntas — balão de conversa com interrogação
  questions: (
    <>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" />
      <path d="M9.7 9.2a2.4 2.4 0 0 1 4.6.9c0 1.6-2.3 2.4-2.3 2.4" />
      <path d="M12 16.5h.01" />
    </>
  ),
  // Conceitos — livro aberto (dicionário)
  concepts: (
    <>
      <path d="M3 4.5h5.5A2.5 2.5 0 0 1 11 7v12.5a2 2 0 0 0-2-2H3z" />
      <path d="M21 4.5h-5.5A2.5 2.5 0 0 0 13 7v12.5a2 2 0 0 1 2-2h6z" />
    </>
  ),
  // Casos — pessoas (personagens)
  cases: (
    <>
      <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" />
      <circle cx="10" cy="8" r="3.5" />
      <path d="M20 20v-1.5a3.5 3.5 0 0 0-2.6-3.4" />
      <path d="M15.5 4.6a3.5 3.5 0 0 1 0 6.8" />
    </>
  ),
  // Pesquisas — frasco/erlenmeyer (base científica)
  research: (
    <>
      <path d="M9 3h6" />
      <path d="M10 3v6.2L5.2 18A1.6 1.6 0 0 0 6.6 20.5h10.8A1.6 1.6 0 0 0 18.8 18L14 9.2V3" />
      <path d="M7.7 14h8.6" />
    </>
  ),
};

export default function LibraryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {ICONS[name]}
    </svg>
  );
}
