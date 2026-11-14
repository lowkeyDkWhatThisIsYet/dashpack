import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { createAuthStore } from "./auth-store";

const base = "http://127.0.0.1:3001";
const password = "a-long-test-password-8472";

async function fixture() {
  const directory = path.resolve(process.cwd(), "..", "tmp");
  await mkdir(directory, { recursive: true });
  const location = await mkdtemp(path.join(directory, "dashboard-auth-"));
  return { location, ...(await createAuthStore(location)) };
}

function request(route: string, body?: object, cookie = "") {
  return new Request(`${base}/api/auth/${route}`, {
    method: body ? "POST" : "GET",
    headers: {
      host: "127.0.0.1:3001",
      origin: base,
      "Content-Type": "application/json",
      cookie,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function cookies(response: Response) {
  return response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
}

test("owner registration hashes passwords, survives restart and revokes signed-out sessions", async () => {
  const store = await fixture();
  const response = await store.auth.handler(
    request("sign-up/email", {
      name: "Test owner",
      email: "owner@example.test",
      password,
    }),
  );
  assert.equal(response.status, 200, await response.clone().text());
  assert.ok(store.hasOwner());
  const cookie = cookies(response);
  assert.ok(cookie);
  assert.match(response.headers.get("set-cookie") || "", /HttpOnly/i);
  const account = store.database
    .prepare('SELECT password FROM "account"')
    .get() as { password: string };
  assert.notEqual(account.password, password);
  assert.ok(account.password.length > 32);
  const secret = await readFile(path.join(store.location, "secret"), "utf8");
  assert.equal(
    (await stat(path.join(store.location, "secret"))).mode & 0o777,
    0o600,
  );
  store.database.close();

  const reopened = await createAuthStore(store.location);
  try {
    assert.equal(
      await readFile(path.join(store.location, "secret"), "utf8"),
      secret,
    );
    const session = await reopened.auth.handler(
      request("get-session", undefined, cookie),
    );
    assert.equal((await session.json()).user.email, "owner@example.test");
    const logout = await reopened.auth.handler(request("sign-out", {}, cookie));
    assert.equal(logout.status, 200);
    const expired = await reopened.auth.handler(
      request("get-session", undefined, cookie),
    );
    assert.equal(await expired.json(), null);
  } finally {
    reopened.database.close();
  }
});

test("a second account cannot claim the Docker workspace", async () => {
  const store = await fixture();
  try {
    const first = await store.auth.handler(
      request("sign-up/email", {
        name: "Owner",
        email: "first@example.test",
        password,
      }),
    );
    assert.equal(first.status, 200);
    const second = await store.auth.handler(
      request("sign-up/email", {
        name: "Other",
        email: "second@example.test",
        password,
      }),
    );
    assert.ok(second.status >= 400);
    assert.equal(
      (
        store.database
          .prepare('SELECT count(*) AS count FROM "user"')
          .get() as { count: number }
      ).count,
      1,
    );
  } finally {
    store.database.close();
  }
});

test("wrong passwords and fabricated sessions are rejected", async () => {
  const store = await fixture();
  try {
    await store.auth.handler(
      request("sign-up/email", {
        name: "Owner",
        email: "owner@example.test",
        password,
      }),
    );
    const wrong = await store.auth.handler(
      request("sign-in/email", {
        email: "owner@example.test",
        password: "incorrect-password-123",
      }),
    );
    assert.equal(wrong.status, 401);
    const fabricated = await store.auth.handler(
      request("get-session", undefined, "better-auth.session_token=fabricated"),
    );
    assert.equal(await fabricated.json(), null);
    const valid = await store.auth.handler(
      request("sign-in/email", { email: "owner@example.test", password }),
    );
    assert.equal(valid.status, 200);
  } finally {
    store.database.close();
  }
});
