"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type Status = "idle" | "loading" | "ok" | "error";

// tone="dark"  → seções escuras (home, wine/verde): campos claros translúcidos.
// tone="light" → seções claras (livro, contato): campos brancos, botão vinho.
/** Os textos do formulário editados no painel (Página inicial → Newsletter).
 *  Um componente de cliente não lê o Sanity, então a página os entrega prontos;
 *  o que faltar cai na tradução. */
export type NewsletterLabels = Partial<
  Record<"newsletterPlaceholder" | "newsletterCta" | "newsletterOk" | "newsletterError", string>
>;

export default function NewsletterForm({
  tone = "dark",
  labels = {},
}: {
  tone?: "dark" | "light";
  labels?: NewsletterLabels;
}) {
  const tr = useTranslations("home");
  const t = (key: keyof NewsletterLabels) => labels[key] || tr(key);
  const locale = useLocale();
  const [email, setEmail] = useState("");
  // Campo-isca: invisível para gente, preenchido por robô (ver src/lib/newsletter.ts).
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const light = tone === "light";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      // /api/newsletter = o serviço Node do cPanel no ar (e a rota do Next no
      // dev), que guarda a inscrição (src/lib/newsletter.ts).
      const endpoint =
        process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT || "/api/newsletter";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, locale, path: window.location.pathname, website }),
      });
      if (res.ok) {
        setStatus("ok");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const locked = status === "loading" || status === "ok";

  return (
    <div className={light ? "mt-2" : "mx-auto mt-8 max-w-md"}>
      {/* Nos quadros claros (Contato, Livro) a coluna é estreita: campo e botão
          empilhados, cada um na largura inteira. Lado a lado, o botão vazava
          do quadro (28/09/2026). */}
      <form onSubmit={onSubmit} className={light ? "flex flex-col gap-3" : "flex flex-col gap-3 sm:flex-row"}>
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="absolute -left-[9999px] h-px w-px opacity-0"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={locked}
          placeholder={t("newsletterPlaceholder")}
          className={
            light
              ? "w-full min-w-0 rounded-full border border-ink/15 bg-cream px-5 py-3.5 text-ink outline-none transition-shadow placeholder:text-muted focus:border-wine disabled:opacity-70"
              : "min-w-0 flex-1 rounded-full bg-cream/10 px-5 py-3 text-cream outline-none ring-1 ring-cream/25 transition-shadow placeholder:text-cream/50 focus:ring-cream/60 disabled:opacity-70"
          }
        />
        <button
          type="submit"
          disabled={locked}
          className={
            light
              ? "w-full rounded-full bg-wine px-7 py-3.5 font-semibold text-cream transition-colors hover:bg-wine-soft disabled:opacity-70"
              : "whitespace-nowrap rounded-full bg-cream px-7 py-3 font-semibold text-wine transition-colors hover:bg-white disabled:opacity-70"
          }
        >
          {status === "ok" ? "✓" : t("newsletterCta")}
        </button>
      </form>
      {status === "ok" && (
        <p className={`mt-3 text-sm ${light ? "text-ink-soft" : "text-cream/90"}`}>
          {t("newsletterOk")}
        </p>
      )}
      {status === "error" && (
        <p className={`mt-3 text-sm ${light ? "text-ink-soft" : "text-cream/90"}`}>
          {t("newsletterError")}
        </p>
      )}
    </div>
  );
}
