import { handlePhoneStatus } from "@/lib/voice/server/phone";

// GET: where one phone call stands: { status, reason, turns }.
export async function GET(request: Request, context: RouteContext<"/api/voice/phone/[id]">) {
  const { id } = await context.params;
  return handlePhoneStatus(request, id);
}
