import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Saída do `node build-painel.mjs` (o Studio buildado). São ~9 MB de
    // bundle minificado: sem esta linha o eslint tenta analisar tudo e morre
    // sem mensagem, com um stack trace do V8.
    "dist-painel/**",
    "dist/**",
    ".sanity/**",
  ]),
]);

export default eslintConfig;
