// The negotiator: Haggle's agent on a call with the bank. See SPEC.md, "Negotiator".
//
//   brief.ts      what the agent may know and say, built by code from the confirmed card
//   prompt.ts     the agent's instructions (text and voice) and its fixed opening line
//   playbooks.ts  per-issuer strategy notes for the agent
//   verify.ts     the code check on what a model read from the transcript
//   server/       the route handlers and the one Claude call (server only)
//
// Everything exported here is pure and safe to import in the browser. Nothing in this file may
// import from ./server.
export { ASK_APR_CUT_BPS, ASK_APR_FLOOR_BPS, WIN_APR_CUT_BPS, aprTargets, buildBrief } from "./brief";
export { playbookFor, type Playbook } from "./playbooks";
export { openingLine, systemPrompt } from "./prompt";
export { verifyOutcome } from "./verify";
