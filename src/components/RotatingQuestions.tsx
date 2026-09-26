"use client";

import { useEffect, useState } from "react";

// Rotaciona as perguntas humanas — o elemento interativo central do hero.
// A lista vem pronta do servidor (painel → Página inicial → Topo): um
// componente de cliente não lê o Sanity.
export default function RotatingQuestions({ questions }: { questions: string[] }) {

  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setShow(false);
      const swap = setTimeout(() => {
        setIndex((prev) => (prev + 1) % questions.length);
        setShow(true);
      }, 450);
      return () => clearTimeout(swap);
    }, 3400);
    return () => clearInterval(id);
  }, [questions.length]);

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
