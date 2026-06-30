import { client } from "./client";

// Helper simples de leitura. Params tipados; locale sempre passado nas queries i18n.
export function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  // ISR: cacheia a leitura por 1h (revalidação em background).
  return client.fetch<T>(query, params, { next: { revalidate: 3600 } });
}
