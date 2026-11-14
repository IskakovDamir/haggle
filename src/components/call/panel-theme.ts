// The call panel is the one dark surface in the product: a phone screen lying on a paper page.
// Its colors are fixed here because the tokens in globals.css describe the light page only.
export const panel = {
  shell: "rounded-[22px] border border-[#262926] bg-[#0f1110] text-[#e9e8e3]",
  /** Secondary text on the dark surface. */
  dim: "text-[#9a9a94]",
  rule: "border-[#262926]",
  agentBubble: "border-[#2c4632] bg-[#1c2a20]",
  bankBubble: "border-[#33332f] bg-[#1f1f1d]",
  field: "border-[#33332f] bg-[#1f1f1d] text-[#e9e8e3] placeholder:text-[#9a9a94]",
} as const;
