import { Link } from "@/i18n/navigation";

type Item = { title: string; slug: string };

// Chips de links (ex.: conceitos relacionados).
export default function ChipLinks({
  items,
  basePath,
}: {
  items: Item[];
  basePath: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((r) => (
        <Link
          key={r.slug}
          href={`${basePath}/${r.slug}`}
          className="rounded-full border border-green-deep/20 px-3.5 py-1.5 text-sm text-green-deep transition-colors hover:bg-green-deep hover:text-cream"
        >
          {r.title}
        </Link>
      ))}
    </div>
  );
}
