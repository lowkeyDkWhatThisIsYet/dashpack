import { dashboard } from "@/lib/server";
import { authorize } from "@/lib/auth";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const denied = await authorize(request);
  if (denied) return denied;
  try {
    return Response.json(await dashboard());
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 403 });
  }
}
