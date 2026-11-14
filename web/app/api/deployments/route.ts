import { createDeployment } from "@/lib/server";
import { validateDeployment } from "@/lib/validation";
import { authorize } from "@/lib/auth";

export async function POST(request: Request) {
  const denied = await authorize(request);
  if (denied) return denied;
  try {
    const input = validateDeployment(await request.json());
    return Response.json(await createDeployment(input), { status: 202 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
