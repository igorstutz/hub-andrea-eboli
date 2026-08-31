"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { asset } from "@/lib/assetPath";
import LanguageSwitcher from "./LanguageSwitcher";

// Foto da Andrea para a "bolinha" (igual à do YouTube). Enquanto o arquivo
// não existe, a bolinha não é renderizada — o header fica só com a assinatura.
// Para ativar: coloque a imagem em public/brand/andrea-avatar.jpg e troque a
// constante abaixo por "/brand/andrea-avatar.jpg" (o asset() cuida do basePath
// do Pages).
const AVATAR_SRC: string | null = null;

// Assinatura da Andrea em vinho (fundo recortado + recolorida). A variante creme
// existe para fundos escuros. O PNG original está FORA do repositório, na pasta
// irmã `brand-originais/` — no projeto fica só o .webp.
const LOGO_SRC = "/brand/logo-andrea-eboli.webp";
const LOGO_W = 900;
const LOGO_H = 159;

// Menu principal (ordem e rótulos definidos com a Andrea em 19/08/2026:
// menos palavras para caber Pesquisa e Confraria). A tese "Ser Poder" saiu:
// virou a própria home.
// "Na mídia" VOLTOU em 31/08/2026 (pedido do Igor, começo da divulgação);
// tinha saído em 19/08. Fica ao lado de Confraria, antes de Livro.
const NAV = [
  { key: "about", href: "/sobre" },
  { key: "articlesQuestions", href: "/artigos-e-perguntas" },
  { key: "videos", href: "/videos" },
  { key: "research", href: "/pesquisa" },
  { key: "confraria", href: "/confraria" },
  { key: "media", href: "/na-midia" },
  { key: "book", href: "/livro" },
  { key: "contact", href: "/contato" },
] as const;

// Destaca o item ativo — inclusive nas páginas de detalhe (uma pergunta ou
// artigo acende "Artigos e Perguntas"; um vídeo acende "Vídeos"; um conceito
// acende nada, porque o glossário vive na home).
function isActive(pathname: string, href: string): boolean {
  if (href === "/artigos-e-perguntas") {
    return (
      pathname.startsWith("/artigos-e-perguntas") ||
      pathname.startsWith("/perguntas") ||
      pathname.startsWith("/artigos")
    );
  }
  if (href === "/videos") return pathname.startsWith("/videos");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Avatar() {
  if (!AVATAR_SRC) return null;
  return (
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-green-deep/25 bg-green-deep text-cream">
      <Image
        src={asset(AVATAR_SRC)}
        alt=""
        width={40}
        height={40}
        className="h-full w-full object-cover"
      />
    </span>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" />
    </svg>
  );
}

export default function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Trava o scroll do body enquanto o drawer está aberto. (O fechamento ao
  // navegar é feito no onClick de cada link, evitando setState em efeito.)
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/85 backdrop-blur">
        <div className="mx-auto flex h-[var(--header-h)] max-w-7xl items-center justify-between gap-6 px-5 sm:px-6">
          {/* Marca: assinatura (+ bolinha da foto, quando houver) */}
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="Andrea Eboli — início"
          >
            <Avatar />
            <Image
              src={asset(LOGO_SRC)}
              alt="Andrea Eboli"
              width={LOGO_W}
              height={LOGO_H}
              priority
              className="h-7 w-auto sm:h-8"
            />
          </Link>

          {/* Navegação — desktop */}
          <nav className="hidden items-center gap-5 lg:flex xl:gap-7">
            {NAV.map(({ key, href }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={key}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative text-[0.9rem] leading-none transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-px after:bg-wine after:transition-all after:duration-300 ${
                    active
                      ? "font-medium text-wine after:w-full"
                      : "text-ink-soft after:w-0 hover:text-wine hover:after:w-full"
                  }`}
                >
                  {t(key)}
                </Link>
              );
            })}
          </nav>

          {/* Ações — desktop */}
          <div className="hidden items-center gap-5 lg:flex">
            <Link
              href="/busca"
              aria-label={t("search")}
              className="text-ink-soft transition-colors hover:text-wine"
            >
              <SearchIcon className="h-5 w-5" />
            </Link>
            <LanguageSwitcher />
          </div>

          {/* Botão do menu — mobile */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center text-green-deep lg:hidden"
          >
            <span className="relative block h-4 w-6">
              <span
                className={`absolute left-0 block h-0.5 w-6 bg-current transition-all duration-300 ${
                  open ? "top-1.5 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 block h-0.5 w-6 bg-current transition-all duration-300 ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-6 bg-current transition-all duration-300 ${
                  open ? "top-1.5 -rotate-45" : "top-3"
                }`}
              />
            </span>
          </button>
        </div>
      </header>

      {/* Drawer — mobile.
          ⚠️ Precisa ficar FORA do <header>: o `backdrop-blur` dele cria bloco de
          contenção para descendentes `position: fixed`, então aqui dentro o
          drawer era posicionado em relação à BARRA (80px) e ficava com altura 0
          — abria, travava o scroll da página e não aparecia nada. */}
      <div
        className={`fixed inset-0 top-[var(--header-h)] z-40 bg-green-deep text-cream transition-all duration-300 lg:hidden ${
          open
            ? "visible opacity-100"
            : "pointer-events-none invisible opacity-0"
        }`}
      >
        <div className="gradient-mesh pointer-events-none absolute inset-0 opacity-40" />
        <nav className="relative flex h-full flex-col overflow-y-auto px-6 py-8">
          {NAV.map(({ key, href }, i) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={key}
                href={href}
                onClick={close}
                className={`border-b border-cream/10 py-4 font-serif text-2xl transition-colors ${
                  active ? "text-cream" : "text-cream/70 hover:text-cream"
                }`}
                style={{ transitionDelay: open ? `${i * 30}ms` : "0ms" }}
              >
                {t(key)}
              </Link>
            );
          })}

          <div className="mt-auto flex items-center justify-between pt-8">
            <Link
              href="/busca"
              onClick={close}
              className="inline-flex items-center gap-2 text-sm uppercase tracking-wider text-cream/80"
            >
              <SearchIcon className="h-5 w-5" />
              {t("search")}
            </Link>
            <div className="[&_a]:text-cream/60 [&_.text-green-deep]:!text-cream">
              <LanguageSwitcher />
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
