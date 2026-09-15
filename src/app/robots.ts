import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Necessário para o export estático.
export const dynamic = "force-static";

/**
 * Os rastreadores de IA que este hub QUER receber.
 *
 * Um site comum omite isto e deixa a regra `*` valer para todos — o que aqui
 * também bastaria, já que nada está bloqueado. A lista explícita existe por
 * dois motivos:
 *
 * 1. Este é um hub de GEO: ser lido e citado por assistentes é o objetivo do
 *    produto, não um efeito colateral tolerado. O arquivo passa a dizer isso.
 * 2. Auditorias de "agent readiness" e parte dos rastreadores procuram o
 *    próprio nome antes de cair no `*`. Estar nomeado remove a dúvida.
 *
 * ⚠️ Não confundir com o bloqueio real: em 15/09/2026 o ClaudeBot recebia 429
 * do LiteSpeed, e isso é regra de SERVIDOR da hospedagem — nenhum robots.txt
 * desfaz. Ver a sessão de 15/09 em .claude/MEMORIA-PROJETO.md.
 */
const AGENTES_DE_IA = [
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "cohere-ai",
  "DeepSeekBot",
  "Bytespider",
  "meta-externalagent",
];

// O painel do Sanity. `noindex` já vai no HTML dele, mas o robots evita o
// rastreamento antes mesmo da leitura da página.
const FORA = ["/admin"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: FORA },
      { userAgent: AGENTES_DE_IA, allow: "/", disallow: FORA },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
