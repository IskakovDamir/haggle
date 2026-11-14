import { ArrowRight } from "lucide-react";
import { Fragment } from "react";

/**
 * Text such as "27.24% → 19.99%" with the arrow drawn as an icon instead of the → character,
 * which renders differently in every font. Screen readers hear "to".
 */
export function ArrowText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(" → ");
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 && (
            <>
              <ArrowRight aria-hidden className={className ?? "mx-1 inline size-3 -translate-y-px"} strokeWidth={2.5} />
              <span className="sr-only"> to </span>
            </>
          )}
          {part}
        </Fragment>
      ))}
    </>
  );
}
