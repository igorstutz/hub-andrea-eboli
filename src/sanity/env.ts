/**
 * Identidade do projeto no Sanity — lida por DOIS empacotadores diferentes.
 *
 * 🔴 POR QUE OS VALORES ESTÃO ESCRITOS AQUI, e não só em `process.env`:
 * este arquivo é importado pelo `sanity.config.ts`, que roda tanto no build do
 * Next (onde `NEXT_PUBLIC_*` é substituída no código) quanto no `sanity build`
 * / `sanity deploy`, que empacotam com **Vite**. E o Vite da Sanity só injeta
 * variáveis com o prefixo `SANITY_STUDIO_`: qualquer outra vira `undefined`,
 * porque ele troca a expressão `process.env` inteira por `{}`.
 *
 * O efeito, medido no bundle do Studio hospedado: `var Ele={}` e depois
 * `Ele.NEXT_PUBLIC_SANITY_DATASET`. Com o `assertValue` que existia aqui, o
 * painel abria e MORRIA na inicialização com "Variável de ambiente ausente:
 * NEXT_PUBLIC_SANITY_DATASET" — build verde, painel inacessível.
 *
 * Não há perda de segurança: projectId e dataset são públicos por natureza
 * (saem no HTML de todas as páginas do site, estão no `sanity.cli.ts` e no
 * workflow de deploy). O que é segredo é o token, e ele não mora aqui.
 *
 * A variável de ambiente continua tendo precedência, para apontar o site para
 * outro dataset sem mexer no código.
 */
const PROJETO = {
  projectId: "52ssivbg",
  dataset: "production",
  apiVersion: "2024-10-01",
} as const;

export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || PROJETO.apiVersion;

export const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET || PROJETO.dataset;

export const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || PROJETO.projectId;
