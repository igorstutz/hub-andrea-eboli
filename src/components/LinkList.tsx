import { Link } from "@/i18n/navigation";

type Item = { title: string; slug: string };

// Lista vertical de links (sidebar: perguntas, casos, artigos, vídeos…).
export default function LinkList({
  items,
  basePath,
}: {
  items: Item[];
  basePath: string;
}) {
  return (
    <ul className="space-y-2.5 text-sm">
      {items.map((r) => (
        <li key={r.slug}>
          <Link
            href={`${basePath}/${r.slug}`}
            className="block border-l-2 border-transparent pl-3 leading-snug text-ink-soft transition-colors hover:border-gold hover:text-green-deep"
          >
            {r.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
