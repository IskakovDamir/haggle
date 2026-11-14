// The sentences a visitor reads when a voice call cannot start or does not finish.
// Each one says what happened and what to do next. Typing is always the way forward.

export const VOICE_PROBLEM = {
  notConfigured: "Voice calls are not set up on this server. Type the call instead.",
  noBrief: "There is no call to start yet. Pick a step from your plan first.",
  unreachable: "We could not reach the server to start the voice call. Check your connection and try again, or type the call instead.",
  couldNotConnect: "The voice call could not connect. Try again, or type the call instead.",
  dropped: "The connection dropped and the voice call ended. Start again, or type the call instead.",
  microphoneBlocked: "The microphone is blocked. Allow it in your browser's site settings and try again, or type the call instead.",
  microphoneMissing: "We could not find a microphone. Plug one in and try again, or type the call instead.",
  microphoneBusy: "The microphone could not be opened. Another app may be using it. Close that app and try again, or type the call instead.",
  microphoneUnsupported: "This browser cannot use the microphone on this page. Type the call instead.",
} as const;

/** The sentence for a failed getUserMedia call. The browser says why through the error's name. */
export function microphoneProblem(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return VOICE_PROBLEM.microphoneBlocked;
    case "NotFoundError":
    case "OverconstrainedError":
      return VOICE_PROBLEM.microphoneMissing;
    case "NotSupportedError":
    case "TypeError":
      return VOICE_PROBLEM.microphoneUnsupported;
    default:
      // NotReadableError, AbortError and anything a browser adds later.
      return VOICE_PROBLEM.microphoneBusy;
  }
}
