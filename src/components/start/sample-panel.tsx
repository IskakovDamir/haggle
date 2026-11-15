"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, Layers } from "lucide-react";
import { EASE, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { SAMPLE_STATEMENTS, type SampleStatement } from "@/lib/statement/samples";
import { cn } from "@/lib/utils";
import { sampleArt } from "./sample-art";
import { SURFACE, onColor } from "./surfaces";

/** The sample statements. Picking one sends its PDF through the same reading as an upload. */
export function SamplePanel({
  onSample,
  onAll,
}: {
  onSample: (sample: SampleStatement) => void;
  /** Read every sample at once: one person with cards at several banks. */
  onAll: () => void;
}) {
  return (
    <div>
      <p className="text-sm text-muted">
        A made-up person. Read just like an upload.
      </p>
      <Button size="lg" className="mt-5 w-full sm:w-auto" onClick={onAll}>
        <Layers className="size-4" aria-hidden />
        Read all {SAMPLE_STATEMENTS.length} of Maria&apos;s cards
      </Button>
      <p className="mt-2 text-sm text-muted">Or pick one:</p>
      <Stagger as="ul" onMount gap={0.06} delay={0.05} className="mt-4 space-y-3">
        {SAMPLE_STATEMENTS.map((sample) => {
          const art = sampleArt(sample.id);
          const dark = onColor(art.surface);
          return (
            <StaggerItem as="li" key={sample.id}>
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.25, ease: EASE }}
                className={cn(
                  "group relative overflow-hidden rounded-[24px] transition-shadow duration-300",
                  SURFACE[art.surface],
                  dark
                    ? "hover:shadow-[0_18px_40px_-20px_rgb(11_18_32/0.55)]"
                    : "hover:shadow-[0_18px_40px_-22px_rgb(47_107_255/0.45)]",
                )}
              >
                {/* The card peeks in from the corner, cut off by the edge as in the design. */}
                <Image
                  src={art.src}
                  alt=""
                  width={art.width}
                  height={art.height}
                  className="pointer-events-none absolute -top-[18px] -right-6 hidden w-[170px] transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:-rotate-2 sm:block"
                />
                <button
                  type="button"
                  onClick={() => onSample(sample)}
                  className="relative flex w-full cursor-pointer items-start gap-4 rounded-[24px] p-5 pb-[22px] text-left sm:pr-[170px]"
                >
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-[18px] leading-6 font-semibold tracking-[-0.02em]", dark ? "text-white" : "text-hg-ink")}>
                      {sample.label}
                    </span>
                    <span className={cn("mt-1 block text-sm font-medium", dark ? "text-white/70" : "text-muted")}>{sample.blurb}</span>
                  </span>
                  <span
                    className={cn(
                      "mt-2 flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-[filter,box-shadow] duration-300 group-hover:shadow-[0_8px_20px_-10px_rgb(11_18_32/0.5)]",
                      dark ? "bg-white text-hg-ink" : "bg-hg-blue text-white group-hover:brightness-110",
                    )}
                  >
                    Read it
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </button>
                <a
                  href={sample.file}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "relative mx-5 mb-3.5 inline-flex items-center gap-1.5 text-sm",
                    dark ? "text-white/70 hover:text-white" : "text-muted hover:text-hg-ink",
                  )}
                >
                  Open the PDF
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </motion.div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
}
