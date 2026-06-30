"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABELS: Record<string, string> = { pt: "PT", en: "EN", es: "ES" };

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const active = useLocale();

  return (
    <div className="flex items-center gap-1 text-xs font-semibold tracking-wider">
      {routing.locales.map((code, i) => (
        <span key={code} className="flex items-center gap-1">
          {i > 0 && <span className="text-ink/30">/</span>}
          <Link
            href={pathname}
            locale={code}
            className={
              active === code
                ? "text-green-deep"
                : "text-ink/40 transition-colors hover:text-wine"
            }
          >
            {LABELS[code] ?? code.toUpperCase()}
          </Link>
        </span>
      ))}
    </div>
  );
}
