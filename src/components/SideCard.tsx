import type { ReactNode } from "react";

// Card padrão da sidebar das páginas de detalhe.
export default function SideCard({
  label,
  muted = false,
  children,
}: {
  label: string;
  muted?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-ink/10 bg-bone p-6">
      <p
        className={`mb-4 text-[0.68rem] font-semibold uppercase tracking-wider ${
          muted ? "text-muted" : "text-green-soft"
        }`}
      >
        {label}
      </p>
      {children}
    </div>
  );
}
