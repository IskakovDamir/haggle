"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { EASE } from "@/components/motion/reveal";
import type { Turn } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatClock } from "./clock";
import { panel } from "./panel-theme";

const bubble = "max-w-[88%] rounded-[18px] border px-3.5 py-2.5 text-[15px] leading-snug";
const agentShape = "self-start rounded-tl-[6px]";
const bankShape = "self-end rounded-tr-[6px]";

function Speaker({ name, at }: { name: string; at?: number }) {
  return (
    <span className="mb-0.5 flex items-baseline gap-2 text-[11px] font-semibold tracking-[0.08em] uppercase opacity-70">
      {name}
      {at !== undefined && <span className="tabular font-normal tracking-normal">{formatClock(at)}</span>}
    </span>
  );
}

/**
 * The lines of a call, as on the landing phone: the agent on the left in blue, the bank on the right in grey.
 * New lines slide in from their speaker's side. With `follow`, the list keeps itself scrolled to the newest line.
 */
export function Transcript({
  turns,
  bankLabel = "Bank",
  agentIsReplying = false,
  follow = false,
  emptyText = null,
  className,
}: {
  turns: Turn[];
  /** Who the bank is on this screen: "You, as the bank" during a practice call. */
  bankLabel?: string;
  agentIsReplying?: boolean;
  follow?: boolean;
  emptyText?: string | null;
  className?: string;
}) {
  const list = useRef<HTMLOListElement>(null);
  // Lines already there when the list opens (a past call, or coming back to one) fade in together; new lines slide.
  const [linesAtOpen] = useState(turns.length);

  useEffect(() => {
    if (follow) list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [follow, turns.length, agentIsReplying]);

  return (
    <ol
      ref={list}
      role="log"
      aria-label="Call transcript"
      className={cn("flex flex-col gap-2.5 overflow-y-auto overscroll-contain", className)}
    >
      {turns.length === 0 && !agentIsReplying && emptyText && (
        <motion.li
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
          className={cn("m-auto px-6 text-center text-sm", panel.dim)}
        >
          {emptyText}
        </motion.li>
      )}

      {turns.map((turn, index) => {
        const agent = turn.role === "agent";
        const fresh = index >= linesAtOpen;
        return (
          <motion.li
            key={`${index}:${turn.at}`}
            initial={fresh ? { opacity: 0, x: agent ? -18 : 18, y: 6, scale: 0.97 } : { opacity: 0 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            transition={{ duration: fresh ? 0.4 : 0.3, ease: EASE }}
            style={{ originX: agent ? 0 : 1, originY: 1 }}
            className={cn(bubble, agent ? cn(panel.agentBubble, agentShape) : cn(panel.bankBubble, bankShape))}
          >
            <Speaker name={agent ? "Haggle" : bankLabel} at={turn.at} />
            <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">{turn.text}</span>
          </motion.li>
        );
      })}

      {agentIsReplying && (
        <motion.li
          initial={{ opacity: 0, x: -14, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: EASE }}
          style={{ originX: 0, originY: 1 }}
          className={cn(bubble, panel.agentBubble, agentShape)}
          aria-label="Haggle is replying"
        >
          <Speaker name="Haggle" />
          <span className="flex h-5 items-center gap-1" aria-hidden>
            {[0, 0.15, 0.3].map((delay) => (
              <motion.span
                key={delay}
                className="size-1.5 rounded-full bg-white"
                animate={{ y: [0, -3, 0], opacity: [0.45, 1, 0.45] }}
                transition={{ duration: 0.9, ease: "easeInOut", repeat: Infinity, delay }}
              />
            ))}
          </span>
        </motion.li>
      )}
    </ol>
  );
}
