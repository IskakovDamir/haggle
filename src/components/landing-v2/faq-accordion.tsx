"use client";

// The FAQ list: one answer open at a time, the first one open on load as in Figma.
import Image from "next/image";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export type FaqEntry = { question: string; answer: string };

export function FaqAccordion({ items }: { items: FaqEntry[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `${baseId}-answer-${i}`;
        return (
          <div
            key={item.question}
            className={cn(
              "rounded-[20px] border transition-colors",
              isOpen ? "border-hg-blue-tint bg-white" : "border-white bg-white/88",
            )}
          >
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center gap-4 rounded-[20px] py-5 pr-5 pl-6 text-left outline-none focus-visible:ring-2 focus-visible:ring-hg-blue"
              >
                <span className="flex-1 text-[17px] leading-6 font-semibold tracking-[-0.01em] text-hg-ink">{item.question}</span>
                <span
                  aria-hidden
                  className={cn("flex size-8 shrink-0 items-center justify-center rounded-2xl", isOpen ? "bg-hg-blue" : "bg-white")}
                >
                  {isOpen ? (
                    <Image src="/landing/faq/icon-minus.svg" alt="" width={10.667} height={1.333} className="block max-w-none" />
                  ) : (
                    <Image src="/landing/faq/icon-plus.svg" alt="" width={10.667} height={10.667} className="block max-w-none" />
                  )}
                </span>
              </button>
            </h3>
            <div id={panelId} role="region" aria-label={item.question} hidden={!isOpen}>
              <p className="-mt-2.5 pr-5 pb-5 pl-6 text-[16px] leading-6 font-medium tracking-[-0.005em] text-hg-ink-2">{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
