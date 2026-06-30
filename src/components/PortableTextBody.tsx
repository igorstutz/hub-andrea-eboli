import {
  PortableText,
  type PortableTextComponents,
} from "@portabletext/react";

type PTValue = React.ComponentProps<typeof PortableText>["value"];

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="mb-4 leading-relaxed text-ink-soft">{children}</p>
    ),
    h2: ({ children }) => (
      <h2 className="mb-3 mt-10 text-3xl text-green-deep">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 mt-8 text-2xl text-green-deep">{children}</h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-2 border-gold pl-5 font-serif text-xl italic text-green-deep">
        {children}
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold text-ink">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ children, value }) => (
      <a
        href={(value as { href?: string })?.href}
        className="text-wine underline underline-offset-2 hover:text-wine-soft"
      >
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="my-4 ml-5 list-disc space-y-2 text-ink-soft">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="my-4 ml-5 list-decimal space-y-2 text-ink-soft">
        {children}
      </ol>
    ),
  },
};

export default function PortableTextBody({ value }: { value?: unknown }) {
  if (!value) return null;
  return <PortableText value={value as PTValue} components={components} />;
}
