// Caminho de arquivos servidos de public/ (logo, foto…) já com o basePath do
// deploy.
//
// POR QUÊ ISTO EXISTE: no GitHub Pages o site vive em /hub-andrea-eboli. O
// export estático exige `images.unoptimized`, e nesse modo o next/image devolve
// o `src` EXATAMENTE como recebeu — sem aplicar o basePath (diferente do que
// acontece com o otimizador, que gera /_next/image?... já prefixado). Resultado:
// "/brand/logo.webp" apontava para igorstutz.github.io/brand/logo.webp → 404.
//
// Regra: todo arquivo de public/ referenciado no código passa por `asset()`.
// A variável é a MESMA que o next.config.ts usa como basePath, para não haver
// duas verdades (definida no workflow de deploy; vazia no dev local).

export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(
  /\/+$/,
  "",
);

export function asset(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}
