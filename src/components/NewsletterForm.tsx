"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Status = "idle" | "loading" | "ok" | "error";

// tone="dark"  → seções escuras (home, wine/verde): campos claros translúcidos.
// tone="light" → seções claras (livro, contato): campos brancos, botão vinho.
export default function NewsletterForm({
  tone = "dark",
}: {
  tone?: "dark" | "light";
}) {
  const t = useTranslations("home");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const light = tone === "light";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      // No site estático (GitHub Pages) não há /api — defina
      // NEXT_PUBLIC_NEWSLETTER_ENDPOINT (webhook do provedor) para ativar.
      const endpoint =
        process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT || "/api/newsletter";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
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
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={locked}
          placeholder={t("newsletterPlaceholder")}
          className={
            light
              ? "flex-1 rounded-full border border-ink/15 bg-cream px-5 py-3 text-ink outline-none transition-shadow placeholder:text-muted focus:border-wine disabled:opacity-70"
              : "flex-1 rounded-full bg-cream/10 px-5 py-3 text-cream outline-none ring-1 ring-cream/25 transition-shadow placeholder:text-cream/50 focus:ring-cream/60 disabled:opacity-70"
          }
        />
        <button
          type="submit"
          disabled={locked}
          className={
            light
              ? "rounded-full bg-wine px-7 py-3 font-semibold text-cream transition-colors hover:bg-wine-soft disabled:opacity-70"
              : "rounded-full bg-cream px-7 py-3 font-semibold text-wine transition-colors hover:bg-white disabled:opacity-70"
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
