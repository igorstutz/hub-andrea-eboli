"use client";

import { useEffect, useRef } from "react";

// Faixa de credenciais em rolagem contínua (CSS) + destaque do item central (JS leve).
export default function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < 100) return; // ~10x por segundo, suficiente e leve
      last = t;

      const box = container.getBoundingClientRect();
      const centerX = box.left + box.width / 2;

      let bestIdx = -1;
      let bestDist = Infinity;
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const c = r.left + r.width / 2;
        const dist = Math.abs(c - centerX);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      });

      itemRefs.current.forEach((el, i) => {
        el?.classList.toggle("marquee-active", i === bestIdx);
      });
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={containerRef} className="marquee">
      <div className="marquee-track">
        {doubled.map((item, i) => (
          <span
            key={i}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className="marquee-item flex shrink-0 items-center gap-10 pr-10"
          >
            <span className="word rounded-full px-4 py-1 font-serif text-2xl italic text-green-deep/55 transition-all duration-300">
              {item}
            </span>
            <span className="h-1 w-1 rounded-full bg-wine/45" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  );
}
