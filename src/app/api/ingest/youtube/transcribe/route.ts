// Invólucro fino: a lógica mora em src/lib/ingest/handlers.ts, compartilhada
// com o serviço Node do cPanel (servidor-ingest/). Aqui só o `npm run dev`.
import { handleTranscribe } from "@/lib/ingest/handlers";

export const runtime = "nodejs";
export const maxDuration = 300; // segundos (relevante em hospedagem serverless)

export const POST = handleTranscribe;
