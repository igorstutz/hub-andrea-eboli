import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// STATIC_EXPORT=1 → build estático. O workflow de deploy remove as rotas de
// servidor (src/app/api, src/app/(studio) e src/proxy.ts) antes de buildar —
// elas não existem em hospedagem estática.
const isStaticExport = process.env.STATIC_EXPORT === "1";

// basePath do deploy. VAZIO quando o site mora na raiz de um domínio
// (andreaeboli.com, o destino); "/hub-andrea-eboli" no GitHub Pages, que serve
// o site dentro do caminho do repositório e define a variável explicitamente.
//
// ⚠️ O PADRÃO É VAZIO, e isso é deliberado. Antes havia
// `process.env.NEXT_PUBLIC_BASE_PATH || "/hub-andrea-eboli"`, com dois
// defeitos: (1) uma variável definida como string vazia caía no fallback, o
// que tornava IMPOSSÍVEL zerar o basePath por ambiente; (2) pior, o fallback
// não era compartilhado — `src/lib/assetPath.ts` usa `?? ""`, então com a
// variável ausente o Next prefixava CSS, JS e chunks com /hub-andrea-eboli/
// enquanto os arquivos de public/ saíam sem prefixo. Meio site prefixado, que
// é a pior falha possível: o build passa e o site quebra.
//
// Com o padrão vazio nos dois lugares, variável ausente produz um site de raiz
// coerente, e o estado híbrido deixa de existir. Quem precisa de prefixo é o
// Pages, e o workflow dele já define a variável.
//
// ⚠️ Para buildar isto à mão no Windows: `$env:X = ""` no PowerShell APAGA a
// variável em vez de defini-la como vazia. Como o padrão agora é vazio, o
// certo é simplesmente NÃO definir a variável para um build de raiz.
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
    ...(isStaticExport ? { unoptimized: true } : {}),
  },
  ...(isStaticExport
    ? {
        output: "export" as const,
        // `basePath: ""` é inválido para o Next; nesse caso a chave nem entra.
        ...(basePath ? { basePath } : {}),
        trailingSlash: true,
      }
    : {}),
};

export default withNextIntl(nextConfig);
