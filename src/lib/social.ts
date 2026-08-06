// Redes sociais oficiais da Andrea — FONTE ÚNICA (rodapé, contato, JSON-LD).
// Ao acrescentar/trocar uma rede, mexa só aqui (e no ícone correspondente em
// src/components/SocialIcon.tsx).

export type SocialId =
  | "instagram"
  | "linkedin"
  | "youtube"
  | "spotify"
  | "whatsapp";

export type SocialLink = {
  id: SocialId;
  /** Nome da rede — marca registrada, não se traduz. */
  name: string;
  href: string;
  /** Arroba/identificador público, quando existir. */
  handle?: string;
};

export const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    id: "instagram",
    name: "Instagram",
    href: "https://www.instagram.com/souandreaeboli",
    handle: "@souandreaeboli",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/andrea-eboli/",
  },
  {
    id: "youtube",
    name: "YouTube",
    href: "https://www.youtube.com/@andrea_eboli",
    handle: "@andrea_eboli",
  },
  {
    // Link limpo — sem os parâmetros de rastreio (si/nd/dlsi) do compartilhamento.
    id: "spotify",
    name: "Spotify",
    href: "https://open.spotify.com/show/2wbyXRM406YYgM4aqnpMqx",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    href: "https://api.whatsapp.com/send?phone=5511971963867",
  },
] as const;

export const INSTAGRAM_URL = SOCIAL_LINKS[0].href;

/** Perfis para o `sameAs` do schema.org (WhatsApp é canal, não perfil). */
export const SOCIAL_SAME_AS = SOCIAL_LINKS.filter(
  (s) => s.id !== "whatsapp",
).map((s) => s.href);
