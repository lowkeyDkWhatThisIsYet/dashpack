import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertAuthRequest,
  assertLocalRequest,
  validateDeployment,
} from "./validation";

const valid = {
  name: "my-app",
  source: "examples/node-vite-react",
  port: 3000,
  healthPath: "/",
  environment: "",
};

test("only OAuth GET callbacks can return from another site on a local host", () => {
  const headers = { host: "127.0.0.1:3001", "sec-fetch-site": "cross-site" };
  for (const provider of ["google", "github"]) {
    const url = `http://127.0.0.1:3001/api/auth/callback/${provider}?code=test&state=test`;
    assert.doesNotThrow(() => assertAuthRequest(new Request(url, { headers })));
    assert.throws(() =>
      assertAuthRequest(new Request(url, { method: "POST", headers })),
    );
    assert.throws(() =>
      assertAuthRequest(
        new Request(url, { headers: { ...headers, host: "evil.test" } }),
      ),
    );
  }
  for (const route of [
    "sign-in/social",
    "sign-out",
    "callback/unknown",
    "callback/google/extra",
  ]) {
    assert.throws(() =>
      assertAuthRequest(
        new Request(`http://127.0.0.1:3001/api/auth/${route}`, { headers }),
      ),
    );
  }
});

test("accepts local projects and public GitHub URLs", () => {
  assert.equal(validateDeployment(valid).source, valid.source);
  assert.equal(
    validateDeployment({
      ...valid,
      source: "https://github.com/owner/project.git",
    }).name,
    "my-app",
  );
});

test("rejects source URLs outside public GitHub repositories", () => {
  for (const source of [
    "https://github.com.evil.test/a/b",
    "https://github.com/a/b/tree/main",
    "ssh://github.com/a/b",
    "https://user:token@github.com/a/b",
    "--upload-pack=evil",
  ]) {
    assert.throws(() => validateDeployment({ ...valid, source }));
  }
});

test("validates health checks, ports and environment variables", () => {
  for (const invalid of [
    { port: 0 },
    { port: 65536 },
    { port: 1.5 },
    { healthPath: "//external.test" },
    { environment: "PORT=9000" },
    { environment: "not-an-assignment" },
    { name: "../../test" },
  ]) {
    assert.throws(() => validateDeployment({ ...valid, ...invalid }));
  }
  assert.equal(
    validateDeployment({
      ...valid,
      environment: "TOKEN=abc=def\nAPP_ENV=production",
    }).environment,
    "TOKEN=abc=def\nAPP_ENV=production",
  );
});

test("requires a local host and same-origin requests", () => {
  assert.doesNotThrow(() =>
    assertLocalRequest(
      new Request("http://localhost:3001/api", {
        headers: { host: "localhost:3001", origin: "http://localhost:3001" },
      }),
    ),
  );
  const rejected: Record<string, string>[] = [
    { host: "evil.test" },
    { host: "localhost:3001", origin: "https://evil.test" },
    { host: "localhost:3001", "sec-fetch-site": "cross-site" },
  ];
  for (const headers of rejected) {
    assert.throws(() =>
      assertLocalRequest(new Request("http://localhost:3001/api", { headers })),
    );
  }
});
