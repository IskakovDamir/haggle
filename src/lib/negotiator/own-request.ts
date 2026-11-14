// The cardholder's own words for what a call is about (NegotiationBrief.request). Typed in the
// browser, so it is treated like any other input: one line, short, and always quoted as JSON wherever
// it goes into a prompt, so it reads as the cardholder's words and never as a section of the prompt.

/** The longest request the routes accept. */
export const MAX_REQUEST_CHARS = 300;

/** The request as typed, on one line with single spaces, or undefined when there is none. */
export function cleanRequest(text: string): string | undefined {
  const line = text.replace(/\s+/g, " ").trim().slice(0, MAX_REQUEST_CHARS);
  return line === "" ? undefined : line;
}

/** The request inside a prompt: quoted, so nothing in it can pose as an instruction. */
export const quotedRequest = (request: string) => JSON.stringify(request);
