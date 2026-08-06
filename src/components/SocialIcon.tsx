import type { ReactNode } from "react";
import type { SocialId } from "@/lib/social";

// Ícones das redes desenhados em traço (sem dependências), na mesma linguagem
// do LibraryIcon: grade 24×24, stroke 1.6, cantos arredondados.
const ICONS: Record<SocialId, ReactNode> = {
  // Instagram — moldura + lente + flash
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="16.7" cy="7.3" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  // LinkedIn — moldura + "in"
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="7.6" cy="8" r="1" fill="currentColor" stroke="none" />
      <path d="M7.6 10.8V17" />
      <path d="M11.4 17v-6.2" />
      <path d="M11.4 13.7c0-1.4 1.1-2.6 2.6-2.6s2.6 1.2 2.6 2.6V17" />
    </>
  ),
  // YouTube — tela + play
  youtube: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="4.5" />
      <path d="M10.4 9.2 15.5 12l-5.1 2.8z" fill="currentColor" stroke="none" />
    </>
  ),
  // Spotify — círculo + três ondas
  spotify: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M7.3 15.2q4.7-2 9.1.7" />
      <path d="M6.4 12.1q5.6-2.5 10.8.8" />
      <path d="M6 8.8q6-2.8 12 .8" />
    </>
  ),
  // WhatsApp — balão com rabicho + monofone (desenhado em escala própria)
  whatsapp: (
    <>
      <path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.5L3.5 20.5l1.5-4.3A8.5 8.5 0 1 1 20.5 11.6Z" />
      <g transform="translate(7.1 6.9) scale(0.4)" strokeWidth={4}>
        <path d="M6 3h3.2l1.6 4-2.2 1.6a12.5 12.5 0 0 0 6.8 6.8L17 13.2l4 1.6V18a3 3 0 0 1-3 3A15 15 0 0 1 3 6a3 3 0 0 1 3-3Z" />
      </g>
    </>
  ),
};

export default function SocialIcon({
  name,
  className,
}: {
  name: SocialId;
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
