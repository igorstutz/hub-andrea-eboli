// Destino do botão "Envie sua pergunta" (bloco Perguntas Humanas).
//
// A decisão (19/08/2026) foi usar um FORMULÁRIO EXTERNO — Tally, Google Forms
// ou similar — porque é o único caminho que também resolve o backlog pedido
// pela Andrea: as perguntas enviadas caem numa planilha que ela revisa. O site
// publicado é estático (GitHub Pages), não há servidor para receber o envio.
//
// Enquanto o formulário não existir, o botão cai no WhatsApp com a mensagem já
// iniciada — funciona hoje, mas o "backlog" fica no histórico de conversas.
// Para trocar: cole a URL do formulário em ASK_QUESTION_FORM_URL.
const ASK_QUESTION_FORM_URL: string | null = null;

const WHATSAPP_FALLBACK =
  "https://api.whatsapp.com/send?phone=5511971963867&text=" +
  encodeURIComponent("Olá! Tenho uma pergunta para o Ser Poder: ");

export const ASK_QUESTION_URL = ASK_QUESTION_FORM_URL ?? WHATSAPP_FALLBACK;

/** true quando o botão abre o formulário definitivo (e não o WhatsApp). */
export const ASK_QUESTION_IS_FORM = ASK_QUESTION_FORM_URL !== null;
