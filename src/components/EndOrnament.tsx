import { Link } from "@/i18n/navigation";

// Fecho ornamental do conteúdo + link de volta para a biblioteca.
export default function EndOrnament({
  backHref,
  backLabel,
}: {
  backHref: string;
  backLabel: string;
}) {
  return (
    <>
      <div
        className="mt-14 flex items-center justify-center gap-4 text-gold"
        aria-hidden
      >
        <span className="h-px w-16 bg-gold/40" />
        <span className="font-serif text-lg">◆</span>
        <span className="h-px w-16 bg-gold/40" />
      </div>
      <div className="mt-10 text-center">
        <Link
          href={backHref}
          className="text-sm font-medium uppercase tracking-wider text-wine transition-colors hover:text-wine-soft"
        >
          ← {backLabel}
        </Link>
      </div>
    </>
  );
}
