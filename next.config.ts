import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// STATIC_EXPORT=1 → build estático para o GitHub Pages
// (https://igorstutz.github.io/hub-andrea-eboli). O workflow de deploy remove
// as rotas de servidor (src/app/api, src/app/studio e src/proxy.ts) antes de
// buildar — elas não existem em hospedagem estática.
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
    ...(isStaticExport ? { unoptimized: true } : {}),
  },
  ...(isStaticExport
    ? {
        output: "export" as const,
        // Mesma variável usada por src/lib/assetPath.ts — o next/image em modo
        // `unoptimized` não aplica o basePath sozinho nos arquivos de public/.
        basePath: process.env.NEXT_PUBLIC_BASE_PATH || "/hub-andrea-eboli",
        trailingSlash: true,
      }
    : {}),
};

export default withNextIntl(nextConfig);
