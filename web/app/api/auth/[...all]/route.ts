import { getAuthStore } from "@/lib/auth";
import { assertLocalRequest } from "@/lib/validation";

async function handle(request: Request) {
  try {
    assertLocalRequest(request);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 403 });
  }
  const { auth } = await getAuthStore();
  return auth.handler(request);
}

export const GET = handle;
export const POST = handle;
