"use client";

// The product demo in the "Be the bank" band: a 39-second screen recording of a real typed practice
// call (a person played Chase with the suggested replies), captions burned in, no sound.
// It plays muted and inline while it is on screen, pauses when it scrolls away, and waits for a
// tap when the visitor asks for reduced motion. The poster is the win screen, so it still tells the story.
import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Copy, Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

const COPY: Copy<{ label: string; play: string; pause: string; fallback: string }> = {
  en: {
    label:
      "Demo video of a practice call. Maria missed a payment. Haggle calls Chase, says it is an AI assistant, and asks for the $40 late fee and the old APR back. Chase agrees to both. The result screen shows $271 saved in the first year and a $54.20 fee, charged only after the win.",
    play: "Play the demo video",
    pause: "Pause the demo video",
    fallback: "Your browser can’t play this video.",
  },
  es: {
    label:
      "Video demo de una llamada de práctica. Maria se atrasó en un pago. Haggle llama a Chase, dice que es un asistente de IA y pide que devuelvan el cargo por atraso de $40 y el APR anterior. Chase acepta ambos. La pantalla de resultado muestra $271 de ahorro el primer año y una tarifa de $54.20, cobrada solo después de ganar.",
    play: "Reproducir el video demo",
    pause: "Pausar el video demo",
    fallback: "Tu navegador no puede reproducir este video.",
  },
};

export function DemoVideo({ locale = "en", className }: { locale?: Locale; className?: string }) {
  const t = COPY[locale];
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  // Once the visitor pauses (or, under reduced motion, until they press play) scrolling never starts it.
  const userPaused = useRef(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;
    if (reduce) {
      userPaused.current = true;
      video.pause();
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!userPaused.current) video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reduce]);

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      userPaused.current = false;
      video.play().catch(() => {});
    } else {
      userPaused.current = true;
      video.pause();
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[30px] border-[6px] border-hg-ink bg-white shadow-[0_30px_60px_-20px_rgba(8,20,70,0.55)]",
        className,
      )}
    >
      <video
        ref={ref}
        className="block aspect-[720/1470] w-full bg-white object-cover"
        poster={`/landing/demo/haggle-demo-${locale}-poster.webp`}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={t.label}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        <source src={`/landing/demo/haggle-demo-${locale}.mp4`} type="video/mp4" />
        {t.fallback}
      </video>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? t.pause : t.play}
        className="absolute right-3 bottom-3 flex size-11 items-center justify-center rounded-full bg-hg-ink/85 text-white shadow-lg backdrop-blur-sm transition-colors duration-200 hover:bg-hg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {playing ? (
          <svg aria-hidden viewBox="0 0 24 24" className="size-[18px]" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1.2" />
            <rect x="14" y="5" width="4" height="14" rx="1.2" />
          </svg>
        ) : (
          <svg aria-hidden viewBox="0 0 24 24" className="ml-0.5 size-[18px]" fill="currentColor">
            <path d="M8 5.6v12.8a1 1 0 0 0 1.53.85l10.2-6.4a1 1 0 0 0 0-1.7L9.53 4.75A1 1 0 0 0 8 5.6Z" />
          </svg>
        )}
      </button>
    </div>
  );
}
