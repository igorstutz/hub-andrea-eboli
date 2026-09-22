// Invólucro fino: a lógica mora em src/lib/ingest/handlers.ts, compartilhada
// com o serviço Node do cPanel (servidor-ingest/). Aqui só o `npm run dev`.
// Estado de um job de geração (a geração é assíncrona — ver src/lib/ingest/jobs.ts).
import { handleGenerateStatus } from "@/lib/ingest/handlers";

export const dynamic = "force-dynamic";

export const GET = handleGenerateStatus;
