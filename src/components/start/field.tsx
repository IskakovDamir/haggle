"use client";

import { AnimatePresence, motion } from "framer-motion";
import { EASE } from "@/components/motion/reveal";
import { Input } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { dollarsForEditing, typedDollars } from "./typed-values";

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  /** A few words after the label, for example "optional". */
  hint?: string;
  /** Puts "$" before the number or "%" after it. The visitor types only the number. */
  unit?: "dollars" | "percent";
  /** Why the typed text cannot be used. Shown instead of the warnings. */
  error?: string;
  /** Things to check against the statement. They do not block. */
  warnings?: string[];
};

/**
 * "8400" becomes "8,400.00" when the visitor leaves the field. Text that is not an amount is left as typed,
 * so its error still shows. The new text goes through the input's own change event, so every form that
 * uses Field picks it up without extra wiring.
 */
function tidyDollars(input: HTMLInputElement) {
  const typed = typedDollars(input.value);
  if (typed.kind !== "value") return;
  const tidy = dollarsForEditing(typed.value);
  if (tidy === input.value) return;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, tidy);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

/** One labeled input with its error or warnings right under it. */
export function Field({ id, label, hint, unit, error, warnings = [], className, ...input }: FieldProps) {
  const notes = error ? [error] : warnings;
  const notesId = `${id}-notes`;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold tracking-[-0.005em] text-hg-ink-2">
        {label}
        {hint && <span className="font-medium text-hg-muted"> {hint}</span>}
      </label>
      <div className="relative">
        {unit === "dollars" && (
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted">
            $
          </span>
        )}
        <Input
          id={id}
          inputMode={unit ? "decimal" : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={notes.length > 0 ? notesId : undefined}
          className={cn(
            "tabular",
            unit === "dollars" && "pl-7",
            unit === "percent" && "pr-9",
            error
              ? "border-alarm focus:border-alarm focus:shadow-[0_0_0_4px_rgb(217_45_32/0.12)]"
              : warnings.length > 0 && "border-leak/60 focus:shadow-[0_0_0_4px_rgb(224_83_31/0.12)]",
          )}
          {...input}
          onBlur={(event) => {
            if (unit === "dollars") tidyDollars(event.currentTarget);
            input.onBlur?.(event);
          }}
        />
        {unit === "percent" && (
          <span aria-hidden className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-muted">
            %
          </span>
        )}
      </div>
      <AnimatePresence initial={false}>
        {notes.length > 0 && (
          <motion.ul
            key="notes"
            id={notesId}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className={cn("space-y-1 overflow-hidden text-sm leading-snug", error ? "text-alarm" : "text-leak")}
          >
            {notes.map((note, index) => (
              <li key={note} className={cn(index === 0 && "pt-1.5")}>
                {note}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
