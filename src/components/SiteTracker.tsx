"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Mede de onde vem cada visita e manda ao serviço da hospedagem
// (andreaeboli.com/api/track). O que o servidor faz com isso, e as escolhas de
// privacidade, estão no topo de src/lib/analytics/track.ts.
//
// O que fica no navegador: só um id de SESSÃO aleatório e a origem daquela
// sessão, em sessionStorage (some ao fechar a aba). Nada de cookie.
//
// 📌 A ORIGEM É A DA ENTRADA. Quem chega por um link com UTM e navega por três
// páginas conta como UMA sessão daquela campanha, e as três páginas carregam a
// mesma origem. Um link novo com UTM no meio da sessão abre uma sessão nova
// (é outra campanha trazendo a pessoa).
//
// Para a Andrea e o Igor não inflarem os próprios números: abrir qualquer
// página com `?naomedir=1` desliga a medição NESTE navegador (e `?naomedir=0`
// religa). Fica em localStorage.

const KEY = "ae-track";
const OPT_OUT = "ae-track-off";
const IDLE_MS = 30 * 60 * 1000;
const UTM_KEYS = ["source", "medium", "campaign", "term", "content"] as const;
const CLICK_IDS = ["gclid", "gbraid", "wbraid", "fbclid", "msclkid", "ttclid", "li_fat_id"];

type Stored = {
  sid: string;
  last: number;
  ref: string;
  clid: string;
  utm: Partial<Record<(typeof UTM_KEYS)[number], string>>;
};

function newSid(): string {
  const a = new Uint8Array(8);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Onde há serviço para receber. No github.io (homologação) não há /api.
function endpoint(): string | null {
  const h = window.location.hostname;
  if (h === "andreaeboli.com" || h === "www.andreaeboli.com") return "/api/track";
  if (h === "localhost" || h === "127.0.0.1") return "/api/track";
  return null;
}

function optedOut(): boolean {
  try {
    const q = new URLSearchParams(window.location.search).get("naomedir");
    if (q === "1") localStorage.setItem(OPT_OUT, "1");
    if (q === "0") localStorage.removeItem(OPT_OUT);
    if (localStorage.getItem(OPT_OUT) === "1") return true;
  } catch {
    // armazenamento bloqueado: segue medindo, sem a preferência
  }
  // "Do Not Track" e Global Privacy Control: quem pediu para não ser medido não é.
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.doNotTrack === "1" || nav.globalPrivacyControl === true;
}

function send(url: string, payload: unknown) {
  const body = JSON.stringify(payload);
  // sendBeacon sobrevive à troca de página; `text/plain` evita preflight.
  const blob = new Blob([body], { type: "text/plain" });
  if (navigator.sendBeacon?.(url, blob)) return;
  fetch(url, { method: "POST", body, keepalive: true }).catch(() => {});
}

export default function SiteTracker({ locale }: { locale: string }) {
  const pathname = usePathname();

  useEffect(() => {
    const url = endpoint();
    if (!url || optedOut()) return;

    const params = new URLSearchParams(window.location.search);
    const utm: Stored["utm"] = {};
    for (const k of UTM_KEYS) {
      const v = params.get(`utm_${k}`);
      if (v) utm[k] = v.slice(0, 150);
    }
    const clid = CLICK_IDS.find((k) => params.has(k)) ?? "";
    const hasNewSource = Object.keys(utm).length > 0 || clid !== "";

    let stored: Stored | null = null;
    try {
      stored = JSON.parse(sessionStorage.getItem(KEY) || "null") as Stored | null;
    } catch {
      stored = null;
    }

    const now = Date.now();
    const expired = !stored || now - stored.last > IDLE_MS;
    const landing = expired || hasNewSource;
    const session: Stored = landing
      ? { sid: newSid(), last: now, ref: document.referrer, clid, utm }
      : { ...stored!, last: now };

    try {
      sessionStorage.setItem(KEY, JSON.stringify(session));
    } catch {
      // sem sessionStorage cada página conta como entrada; ainda é informação
    }

    send(url, {
      sid: session.sid,
      path: window.location.pathname,
      locale,
      landing,
      ref: session.ref,
      clid: session.clid,
      utm: session.utm,
    });
  }, [pathname, locale]);

  return null;
}
