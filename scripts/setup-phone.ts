// Connects a Twilio phone number to ElevenLabs, so the agent can ring real phones.
//
//   pnpm setup:phone
//
// Reads from .env.local:
//   ELEVENLABS_API_KEY     the same key the voice calls use
//   TWILIO_ACCOUNT_SID     from the Twilio console (starts with AC)
//   TWILIO_AUTH_TOKEN      from the Twilio console
//   TWILIO_PHONE_NUMBER    the Twilio number the calls come from, like +15551234567
//
// Prints ELEVENLABS_PHONE_NUMBER_ID. Add it to .env.local together with PHONE_ALLOWED_NUMBERS
// (the numbers the agent may ring, separated by commas), then restart the server.
import { toE164 } from "@/lib/voice/phone";
import { ElevenLabsError, importTwilioNumber } from "@/lib/voice/server/elevenlabs";

async function main(): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = toE164(process.env.TWILIO_PHONE_NUMBER ?? "");

  const missing = [
    !apiKey && "ELEVENLABS_API_KEY",
    !sid && "TWILIO_ACCOUNT_SID",
    !token && "TWILIO_AUTH_TOKEN",
    !phoneNumber && "TWILIO_PHONE_NUMBER (like +15551234567)",
  ].filter(Boolean);
  if (missing.length > 0 || !apiKey || !sid || !token || !phoneNumber) {
    console.error(`Add these to .env.local, then run \`pnpm setup:phone\` again:\n  ${missing.join("\n  ")}`);
    process.exitCode = 1;
    return;
  }

  try {
    const id = await importTwilioNumber(apiKey, { label: "Haggle calls", phoneNumber, sid, token });
    console.log(`Connected ${phoneNumber} to ElevenLabs.`);
    console.log("\nAdd these lines to .env.local, and to the host's environment variables, then restart the server:\n");
    console.log(`ELEVENLABS_PHONE_NUMBER_ID=${id}`);
    console.log("PHONE_ALLOWED_NUMBERS=+1XXXXXXXXXX   # your own phone; separate several with commas");
  } catch (error) {
    if (error instanceof ElevenLabsError) {
      console.error(`ElevenLabs refused the number (${error.status}): ${error.detail}`);
      if (error.status === 409 || /already/i.test(error.detail)) {
        console.error("It may be connected already: find its id under Phone Numbers in the ElevenLabs dashboard.");
      }
    } else {
      console.error(error instanceof Error ? error.message : error);
    }
    process.exitCode = 1;
  }
}

void main();
