import { connection } from "next/server";
import { capabilities, ok } from "@/lib/server/http";

// GET: which features the server's keys switch on, so pages can show an honest "not configured" state.
export async function GET() {
  await connection();
  return ok(capabilities());
}
