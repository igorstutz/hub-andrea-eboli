// Invólucro fino: a lógica mora em src/lib/analytics/track.ts, compartilhada
// com o serviço Node do cPanel (servidor-ingest/). Aqui só o `npm run dev`.
import { handleTrack } from "@/lib/analytics/track";

export const dynamic = "force-dynamic";

export const POST = handleTrack;
