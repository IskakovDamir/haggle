import { cn } from "@/lib/utils";
import { panel } from "./panel-theme";

export type LineState = "ready" | "connecting" | "live" | "ended";

const LINE_LABELS: Record<LineState, string> = {
  ready: "Ready",
  connecting: "Connecting",
  live: "Live",
  ended: "Ended",
};

/** The dark, phone-like panel the call happens in: who is on the line, the timer, and whatever the call shows. */
export function CallPanel({
  line,
  callee,
  clock,
  children,
}: {
  line: LineState;
  /** Who the agent is calling: the bank's name. */
  callee: string;
  /** Call time, already formatted. */
  clock: string;
  children: React.ReactNode;
}) {
  const live = line === "live";
  return (
    <section aria-label={`Practice call with ${callee}`} className={cn(panel.shell, "flex flex-col gap-4 p-4 sm:p-5")}>
      <div className={cn("flex items-center justify-between gap-3 text-[13px]", panel.dim)}>
        <span className={cn("flex min-w-0 items-center gap-2 font-bold", live && "text-lime")}>
          <span
            aria-hidden
            className={cn(
              "size-2 shrink-0 rounded-full",
              live ? "bg-lime shadow-[0_0_0_4px_rgba(201,242,107,0.2)]" : "bg-[#9a9a94]",
              line === "connecting" && "animate-pulse",
            )}
          />
          <span className="truncate">
            <span className="uppercase">{LINE_LABELS[line]}</span> · {callee}
          </span>
        </span>
        <span className="tabular shrink-0" aria-label="Call time">
          {clock}
        </span>
      </div>
      {children}
    </section>
  );
}
