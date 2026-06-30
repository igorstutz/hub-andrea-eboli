"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Status = "idle" | "loading" | "ok" | "error";

export default function NewsletterForm() {
  const t = useTranslations("home");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
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
    <div className="mx-auto mt-8 max-w-md">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={locked}
          placeholder={t("newsletterPlaceholder")}
          className="flex-1 rounded-full bg-cream/10 px-5 py-3 text-cream outline-none ring-1 ring-cream/25 transition-shadow placeholder:text-cream/50 focus:ring-cream/60 disabled:opacity-70"
        />
        <button
          type="submit"
          disabled={locked}
          className="rounded-full bg-cream px-7 py-3 font-semibold text-wine transition-colors hover:bg-white disabled:opacity-70"
        >
          {status === "ok" ? "✓" : t("newsletterCta")}
        </button>
      </form>
      {status === "ok" && (
        <p className="mt-3 text-sm text-cream/90">{t("newsletterOk")}</p>
      )}
      {status === "error" && (
        <p className="mt-3 text-sm text-cream/90">{t("newsletterError")}</p>
      )}
    </div>
  );
}
