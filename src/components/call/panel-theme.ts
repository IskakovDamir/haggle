// The call panel echoes the phone on the landing: a white screen in an ink bezel,
// Haggle's lines in brand blue, the bank's lines on the pale surface.
export const panel = {
  /** The screen itself: also used on its own (the dashboard's call history) without the bezel. */
  shell: "rounded-[24px] border border-line bg-white text-ink",
  /** The ink frame around the screen during a call, as on the landing phone. */
  bezel: "rounded-[48px] bg-[linear-gradient(135deg,#2b3446_0%,#0b1220_72%)] p-2 shadow-[0_30px_60px_-30px_rgb(11_18_32/0.55)]",
  /** The screen inside the bezel: rounder than the bare shell, to sit 8px inside the frame. */
  screen: "rounded-[40px]",
  /** A dark ink card on a light surface: the agent's opening lines, for one. */
  ink: "bg-[linear-gradient(135deg,#2b3446_0%,#0b1220_72%)] text-white",
  /** Secondary text on an ink or blue card. */
  dimOnDark: "text-white/68",
  /** Secondary text on the panel. */
  dim: "text-hg-muted",
  rule: "border-line",
  agentBubble: "border-transparent bg-hg-blue text-white",
  bankBubble: "border-transparent bg-hg-surface text-hg-ink",
  field: "border-line bg-hg-surface text-ink placeholder:text-hg-muted",
} as const;
