import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Convenção "proxy" do Next.js 16 (sucessora de "middleware").
export default createMiddleware(routing);

export const config = {
  // Roda em todas as rotas, exceto API, internos do Next, o Studio do Sanity
  // e arquivos estáticos (com extensão).
  matcher: ["/((?!api|_next|_vercel|studio|.*\\..*).*)"],
};
