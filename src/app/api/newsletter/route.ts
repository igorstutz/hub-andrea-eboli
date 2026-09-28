// Invólucro fino: a lógica mora em src/lib/newsletter.ts, compartilhada com o
// serviço Node do cPanel (servidor-ingest/). Aqui só o `npm run dev`.
import { handleNewsletter } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

export const POST = handleNewsletter;
