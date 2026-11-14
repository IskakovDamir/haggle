import { handleStartPhoneCall } from "@/lib/voice/server/phone";

// POST { brief, toNumber, voiceId? }: the agent rings toNumber (only numbers in PHONE_ALLOWED_NUMBERS)
// and the person who answers plays the bank. Answers { conversationId }.
export function POST(request: Request) {
  return handleStartPhoneCall(request);
}
