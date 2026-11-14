"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Turn } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatClock } from "./clock";
import { panel } from "./panel-theme";

const bubble = "max-w-[88%] rounded-2xl border px-3.5 py-3 text-[15px] leading-snug";

function Speaker({ name, at }: { name: string; at?: number }) {
  return (
    <span className="mb-1 flex items-baseline gap-2 text-[11px] font-semibold tracking-[0.08em] uppercase opacity-70">
      {name}
      {at !== undefined && <span className="tabular font-normal tracking-normal">{formatClock(at)}</span>}
    </span>
  );
}

/**
 * The lines of a call on the dark panel: the agent on the left in green, the bank on the right in grey.
 * With `follow`, the list keeps itself scrolled to the newest line.
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
        <li className={cn("m-auto px-6 text-center text-sm", panel.dim)}>{emptyText}</li>
      )}

      {turns.map((turn, index) => (
        <motion.li
          key={`${index}:${turn.at}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(bubble, turn.role === "agent" ? panel.agentBubble : cn(panel.bankBubble, "self-end"))}
        >
          <Speaker name={turn.role === "agent" ? "Haggle" : bankLabel} at={turn.at} />
          <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">{turn.text}</span>
        </motion.li>
      ))}

      {agentIsReplying && (
        <li className={cn(bubble, panel.agentBubble)} aria-label="Haggle is replying">
          <Speaker name="Haggle" />
          <span className="flex h-5 items-center gap-1" aria-hidden>
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="size-1.5 animate-pulse rounded-full bg-lime"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </span>
        </li>
      )}
    </ol>
  );
}
