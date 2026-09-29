"use client";

import { useEffect, useState } from "react";

// Rotaciona as perguntas humanas — o elemento interativo central do hero.
// A lista vem pronta do servidor (painel → Página inicial → Topo): um
// componente de cliente não lê o Sanity.
export default function RotatingQuestions({ questions }: { questions: string[] }) {

  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(true);

  // Cada pergunta fica o tempo de ser lida: 2,5 s + 55 ms por letra, no mínimo
  // 4,5 s (29/09/2026; antes eram 3,4 s fixos, curto para as perguntas longas).
  // Uma de 40 letras fica 4,7 s; uma de 100, 8 s.
  useEffect(() => {
    if (questions.length < 2) return;
    const current = questions[index] ?? "";
    const hold = Math.max(4500, 2500 + current.length * 55);
    let swap: ReturnType<typeof setTimeout>;
    const out = setTimeout(() => {
      setShow(false);
      swap = setTimeout(() => {
        setIndex((prev) => (prev + 1) % questions.length);
        setShow(true);
      }, 450);
    }, hold);
    return () => {
      clearTimeout(out);
      clearTimeout(swap);
    };
  }, [index, questions]);

  return (
    <span
      className={`q-rotate block font-serif italic text-cream ${
        show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      “{questions[index]}”
    </span>
  );
}
