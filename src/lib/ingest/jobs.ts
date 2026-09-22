// Jobs da geração, guardados em disco.
//
// 🔴 POR QUE A GERAÇÃO É ASSÍNCRONA: medido em 21/09/2026 no serviço publicado,
// o LiteSpeed da hospedagem corta qualquer requisição que passe de ~120 s
// ("500 Request Timeout … increase 'Connection Timeout'", aos 121 s), e uma
// geração com o Claude sobre a transcrição de um podcast leva de 1 a 4
// minutos. Esse limite é do servidor web, fora do alcance do .htaccess. Então
// `POST /ingest/generate` responde 202 com um id na hora, o trabalho segue
// dentro do processo Node, e `GET /ingest/generate/<id>` devolve o estado.
//
// POR QUE EM DISCO, E NÃO NUM Map: o Passenger pode manter mais de um processo
// do app, e a consulta pode cair num processo diferente do que gerou. Um
// arquivo por job, numa pasta temporária do usuário, é visível a todos. No
// CloudLinux o /tmp é por conta (CageFS), então não vaza para outros clientes.
//
// Cada job guarda o `ownerId` (id do usuário no projeto Sanity) e só o mesmo
// usuário lê o resultado. Um job "running" há mais de STALE_MS é dado como
// morto (o processo foi reiniciado no meio) e vira "failed" na leitura.

import { randomUUID } from "node:crypto";
import {
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export type JobRecord<T> =
  | { status: "running"; ownerId: string; startedAt: string }
  | {
      status: "completed";
      ownerId: string;
      startedAt: string;
      finishedAt: string;
      result: T;
    }
  | {
      status: "failed";
      ownerId: string;
      startedAt: string;
      finishedAt: string;
      error: string;
      message: string;
    };

const DIR =
  process.env.INGEST_JOBS_DIR || path.join(tmpdir(), "andrea-ingest-jobs");
const STALE_MS = 15 * 60 * 1000;
const KEEP_MS = 2 * 60 * 60 * 1000;
const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function fileFor(id: string): string {
  return path.join(DIR, `${id}.json`);
}

async function write(id: string, record: JobRecord<unknown>): Promise<void> {
  await mkdir(DIR, { recursive: true });
  // Escreve num arquivo ao lado e renomeia: quem lê nunca vê JSON pela metade.
  const tmp = `${fileFor(id)}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(record), "utf8");
  await rename(tmp, fileFor(id));
}

// Apaga jobs velhos. Melhor esforço: falhar aqui não pode derrubar um job novo.
async function sweep(): Promise<void> {
  try {
    const now = Date.now();
    for (const f of await readdir(DIR)) {
      if (!f.endsWith(".json")) continue;
      const full = path.join(DIR, f);
      const s = await stat(full).catch(() => null);
      if (s && now - s.mtimeMs > KEEP_MS) await rm(full, { force: true }).catch(() => {});
    }
  } catch {
    // pasta ainda não existe, ou sem permissão de listar — segue
  }
}

export async function createJob(ownerId: string): Promise<string> {
  const id = randomUUID();
  await write(id, { status: "running", ownerId, startedAt: new Date().toISOString() });
  void sweep();
  return id;
}

export async function completeJob<T>(id: string, ownerId: string, startedAt: string, result: T): Promise<void> {
  await write(id, {
    status: "completed",
    ownerId,
    startedAt,
    finishedAt: new Date().toISOString(),
    result,
  });
}

export async function failJob(
  id: string,
  ownerId: string,
  startedAt: string,
  error: string,
  message: string,
): Promise<void> {
  await write(id, {
    status: "failed",
    ownerId,
    startedAt,
    finishedAt: new Date().toISOString(),
    error,
    message,
  });
}

export async function readJob<T>(id: string): Promise<JobRecord<T> | null> {
  if (!ID_RE.test(id)) return null;
  let raw: string;
  try {
    raw = await readFile(fileFor(id), "utf8");
  } catch {
    return null;
  }
  let record: JobRecord<T>;
  try {
    record = JSON.parse(raw) as JobRecord<T>;
  } catch {
    return null;
  }
  if (
    record.status === "running" &&
    Date.now() - new Date(record.startedAt).getTime() > STALE_MS
  ) {
    return {
      status: "failed",
      ownerId: record.ownerId,
      startedAt: record.startedAt,
      finishedAt: new Date().toISOString(),
      error: "stale",
      message:
        "A geração foi interrompida no servidor (o processo reiniciou no meio). Tente de novo.",
    };
  }
  return record;
}
