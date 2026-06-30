import type { NextRequest } from "next/server";

// Inscrição na newsletter. Provider-agnóstico: se NEWSLETTER_WEBHOOK_URL
// estiver definido (Mailchimp/ConvertKit/Beehiiv/Zapier...), encaminha o e-mail;
// caso contrário, valida e responde OK (pronto para plugar o provedor).
export async function POST(req: NextRequest) {
  let email = "";
  try {
    const body = await req.json();
    email = (body?.email ?? "").toString().trim();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }

  const endpoint = process.env.NEWSLETTER_WEBHOOK_URL;
  if (endpoint) {
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!r.ok) {
        return Response.json({ error: "provider" }, { status: 502 });
      }
    } catch {
      return Response.json({ error: "provider" }, { status: 502 });
    }
  }

  return Response.json({ ok: true });
}
