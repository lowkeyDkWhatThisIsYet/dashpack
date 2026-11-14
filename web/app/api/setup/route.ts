import { startBuilder } from "@/lib/server";
import { authorize } from "@/lib/auth";

export async function POST(request: Request) {
  const denied = await authorize(request);
  if (denied) return denied;
  try {
    await startBuilder();
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
