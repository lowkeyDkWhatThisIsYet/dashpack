import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { getMigrations } from "better-auth/db/migration";
import Database from "better-sqlite3";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export async function createAuthStore(directory: string) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const secretPath = path.join(directory, "secret");
  let secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    try {
      await writeFile(secretPath, randomBytes(48).toString("base64url"), {
        flag: "wx",
        mode: 0o600,
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    secret = await readFile(secretPath, "utf8");
  }
  const database = new Database(path.join(directory, "auth.sqlite"));
  database.pragma("journal_mode = WAL");
  database.pragma("busy_timeout = 5000");
  const hasOwner = () =>
    Boolean(database.prepare('SELECT id FROM "user" LIMIT 1').get());
  const auth = betterAuth({
    appName: "Dashpack",
    database,
    secret,
    baseURL: {
      allowedHosts: ["localhost:*", "127.0.0.1:*"],
      protocol: "http",
      fallback: "http://127.0.0.1:3001",
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 20 },
    databaseHooks: {
      user: {
        create: {
          before: async () => {
            if (hasOwner())
              throw new APIError("FORBIDDEN", {
                message: "This workspace already has an owner. Please sign in.",
              });
          },
        },
      },
    },
  });
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  // Enforce single-owner registration even when two sign-ups arrive together.
  database.exec(
    'CREATE UNIQUE INDEX IF NOT EXISTS dashpack_single_owner ON "user" ((1))',
  );
  return { auth, hasOwner, database };
}
