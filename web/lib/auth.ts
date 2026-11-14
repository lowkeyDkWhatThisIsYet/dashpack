import "server-only";
import path from "node:path";
import { createAuthStore } from "./auth-store";
import { assertLocalRequest } from "./validation";

type Store = ReturnType<typeof createAuthStore>;
const state = globalThis as typeof globalThis & { dashpackAuth?: Store };

export function getAuthStore() {
  if (!state.dashpackAuth) {
    const root = path.resolve(
      process.env.DASHPACK_ROOT || path.join(process.cwd(), ".."),
    );
    state.dashpackAuth = createAuthStore(
      process.env.DASHPACK_AUTH_DIR || path.join(root, "web", ".data", "auth"),
    );
  }
  return state.dashpackAuth;
}

export async function getSession(headers: Headers) {
  const { auth } = await getAuthStore();
  return auth.api.getSession({ headers });
}

// Check the session at every Docker API boundary, rather than trusting a page redirect.
export async function authorize(request: Request): Promise<Response | null> {
  try {
    assertLocalRequest(request);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 403 });
  }
  if (!(await getSession(request.headers)))
    return Response.json(
      { error: "Please sign in to your workspace." },
      { status: 401 },
    );
  return null;
}
