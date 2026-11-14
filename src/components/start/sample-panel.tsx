"use client";

import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, Layers } from "lucide-react";
import { EASE, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { SampleBadge } from "@/components/ui/primitives";
import { SAMPLE_STATEMENTS, type SampleStatement } from "@/lib/statement/samples";

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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <SampleBadge />
        <p className="text-sm text-muted">
          Made-up people and numbers. Each one is a PDF file that is read the same way an upload is.
        </p>
      </div>
      <Button size="lg" className="mt-5 w-full sm:w-auto" onClick={onAll}>
        <Layers className="size-4" aria-hidden />
        Read all {SAMPLE_STATEMENTS.length} of Maria&apos;s cards
      </Button>
      <p className="mt-2 text-sm text-muted">Three banks, one plan, one list of calls. Or pick one:</p>
      <Stagger as="ul" onMount gap={0.06} delay={0.05} className="mt-4 space-y-3">
        {SAMPLE_STATEMENTS.map((sample) => (
          <StaggerItem as="li" key={sample.id}>
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="group rounded-[24px] border border-line bg-card shadow-[0_1px_2px_rgb(11_18_32/0.04)] transition-[border-color,box-shadow] duration-300 hover:border-hg-blue-tint hover:shadow-[0_18px_40px_-22px_rgb(47_107_255/0.45)]"
            >
              <button
                type="button"
                onClick={() => onSample(sample)}
                className="flex w-full cursor-pointer items-center gap-4 rounded-[24px] p-5 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[18px] leading-6 font-semibold tracking-[-0.02em] text-hg-ink">{sample.label}</span>
                  <span className="mt-1 block text-sm font-medium text-muted">{sample.blurb}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-hg-blue-soft px-3 py-1.5 text-sm font-semibold text-hg-blue transition-colors duration-300 group-hover:bg-hg-blue group-hover:text-white">
                  Read it
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
                </span>
              </button>
              <a
                href={sample.file}
                target="_blank"
                rel="noreferrer"
                className="mx-5 mb-4 inline-flex items-center gap-1.5 text-sm text-muted underline underline-offset-2 hover:text-hg-ink"
              >
                Open the PDF
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </motion.div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
