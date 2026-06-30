"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

// Rotaciona as perguntas humanas — o elemento interativo central do hero.
export default function RotatingQuestions() {
  const t = useTranslations("home");
  const questions = t.raw("rotatingQuestions") as string[];

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
      className={`q-rotate block font-serif italic text-gold ${
        show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      “{questions[index]}”
    </span>
  );
}
