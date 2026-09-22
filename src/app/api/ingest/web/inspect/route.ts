// Invólucro fino: a lógica mora em src/lib/ingest/handlers.ts, compartilhada
// com o serviço Node do cPanel (servidor-ingest/). Aqui só o `npm run dev`.
import { handleWebInspect } from "@/lib/ingest/handlers";

export const POST = handleWebInspect;
