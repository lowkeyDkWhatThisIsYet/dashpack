import { containerAction, containerLogs } from "@/lib/server";
import { authorize } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const denied = await authorize(request);
  if (denied) return denied;
  try {
    return Response.json({
      logs: await containerLogs((await context.params).id),
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function POST(request: Request, context: Context) {
  const denied = await authorize(request);
  if (denied) return denied;
  try {
    const { action } = await request.json();
    await containerAction((await context.params).id, action);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
