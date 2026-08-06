"use client";

import { useState, type ReactNode } from "react";

// Toggle TEMPORÁRIO da página "Artigos e Perguntas": escolhe qual bloco vem
// primeiro. Antes as perguntas vinham sempre na frente e os artigos só
// apareciam no fim da página. Quando os artigos ganharem página própria, este
// componente sai (junto com a chave i18n `articlesQuestionsPage.orderLabel`).
//
// Os dois blocos continuam na página — só trocam de lugar, então nada de
// conteúdo fica escondido. A troca é feita reordenando os elementos (com `key`
// estável, para o React MOVER os nós e não perder o que já foi digitado na
// busca), e não com `order` do CSS — assim a ordem do DOM acompanha a visual
// para teclado e leitor de tela. O fundo acompanha a POSIÇÃO (o de cima fica
// creme, o de baixo areia), não o conteúdo.
export default function SectionOrderToggle({
  label,
  questionsLabel,
  articlesLabel,
  questions,
  articles,
}: {
  label: string;
  questionsLabel: string;
  articlesLabel: string;
  questions: ReactNode;
  articles: ReactNode;
}) {
  const [first, setFirst] = useState<"questions" | "articles">("questions");

  const button = (active: boolean) =>
    `rounded-full px-5 py-2 text-sm font-medium transition-colors ${
      active ? "bg-wine text-cream" : "text-ink-soft hover:text-wine"
    }`;

  const content = { questions, articles };
  const order =
    first === "questions"
      ? (["questions", "articles"] as const)
      : (["articles", "questions"] as const);

  return (
    <>
      <div className="border-b border-ink/10 bg-cream">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-3 px-6 py-5">
          <span className="kicker text-muted">{label}</span>
          <div className="flex items-center gap-1 rounded-full border border-ink/10 bg-white p-1">
            <button
              type="button"
              onClick={() => setFirst("questions")}
              aria-pressed={first === "questions"}
              className={button(first === "questions")}
            >
              {questionsLabel}
            </button>
            <button
              type="button"
              onClick={() => setFirst("articles")}
              aria-pressed={first === "articles"}
              className={button(first === "articles")}
            >
              {articlesLabel}
            </button>
          </div>
        </div>
      </div>

      {order.map((key, i) => (
        <section
          key={key}
          className={i === 0 ? "bg-cream" : "border-t border-ink/10 bg-bone"}
        >
          <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
            {content[key]}
          </div>
        </section>
      ))}
    </>
  );
}
