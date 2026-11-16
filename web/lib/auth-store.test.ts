import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { createAuthStore } from "./auth-store";

const base = "http://127.0.0.1:3001";
const password = "a-long-test-password-8472";

async function fixture(providers?: Parameters<typeof createAuthStore>[1]) {
  const directory = path.resolve(process.cwd(), "..", "tmp");
  await mkdir(directory, { recursive: true });
  const location = await mkdtemp(path.join(directory, "dashboard-auth-"));
  return { location, ...(await createAuthStore(location, providers)) };
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

test("social sign-in creates provider redirects with state and rejects forged callbacks", async () => {
  const store = await fixture({
    google: { clientId: "test-google", clientSecret: "test-secret" },
    github: { clientId: "test-github", clientSecret: "test-secret" },
  });
  try {
    for (const provider of ["google", "github"]) {
      const response = await store.auth.handler(
        request("sign-in/social", {
          provider,
          callbackURL: "/dashboard",
          newUserCallbackURL: "/dashboard",
          errorCallbackURL: "/signup?error=oauth",
          disableRedirect: true,
        }),
      );
      assert.equal(response.status, 200, await response.clone().text());
      const url = new URL((await response.json()).url);
      assert.equal(
        url.hostname,
        provider === "google" ? "accounts.google.com" : "github.com",
      );
      assert.equal(url.searchParams.get("client_id"), `test-${provider}`);
      assert.equal(
        url.searchParams.get("redirect_uri"),
        `${base}/api/auth/callback/${provider}`,
      );
      assert.ok(url.searchParams.get("state"));
      assert.ok(cookies(response));
      const callback = await store.auth.handler(
        request(`callback/${provider}?code=fake&state=forged`),
      );
      assert.equal(callback.status, 302);
      assert.equal(
        await store.auth.api.getSession({ headers: callback.headers }),
        null,
      );
      assert.equal(store.hasOwner(), false);
    }
  } finally {
    store.database.close();
  }
});

test("GitHub callback establishes an owner session and redirects to the dashboard", async (t) => {
  const store = await fixture({
    github: { clientId: "test-github", clientSecret: "test-secret" },
  });
  // Stub only provider traffic so real state validation, persistence and cookies run.
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url === "https://github.com/login/oauth/access_token") {
      return Response.json({
        access_token: "test-token",
        token_type: "bearer",
        scope: "user:email",
      });
    }
    if (url === "https://api.github.com/user") {
      return Response.json({
        id: 123,
        login: "owner",
        name: "Owner",
        email: "owner@example.test",
        avatar_url: null,
      });
    }
    if (url === "https://api.github.com/user/emails") {
      return Response.json([
        { email: "owner@example.test", primary: true, verified: true },
      ]);
    }
    throw new Error(`Unexpected provider request: ${url}`);
  });
  try {
    const start = await store.auth.handler(
      request("sign-in/social", {
        provider: "github",
        callbackURL: "/dashboard",
        disableRedirect: true,
      }),
    );
    const url = new URL((await start.json()).url);
    const callback = await store.auth.handler(
      request(
        `callback/github?code=test-code&state=${encodeURIComponent(url.searchParams.get("state")!)}`,
        undefined,
        cookies(start),
      ),
    );
    assert.equal(callback.status, 302, await callback.clone().text());
    assert.equal(
      new URL(callback.headers.get("location")!, base).pathname,
      "/dashboard",
    );
    const session = await store.auth.handler(
      request("get-session", undefined, cookies(callback)),
    );
    assert.equal((await session.json()).user.email, "owner@example.test");
    assert.equal(store.hasOwner(), true);
  } finally {
    store.database.close();
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
