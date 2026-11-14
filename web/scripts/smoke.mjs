import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";

const port =
  process.env.DASHPACK_SMOKE_PORT ||
  (process.argv.includes("--auth") ? "3002" : "3001");
const base = `http://127.0.0.1:${port}`;
let cookie = "";
let server;
if (process.argv.includes("--auth")) {
  try {
    await fetch(base);
    throw new Error(
      `Port ${port} is already in use. Set DASHPACK_SMOKE_PORT to another local port.`,
    );
  } catch (error) {
    if (!String(error).includes("fetch failed")) throw error;
  }
  const temporary = path.resolve(process.cwd(), "..", "tmp");
  await mkdir(temporary, { recursive: true });
  const directory = await mkdtemp(
    path.join(temporary, "dashboard-auth-smoke-"),
  );
  server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      port,
    ],
    {
      detached: true,
      env: { ...process.env, DASHPACK_AUTH_DIR: directory },
      stdio: ["ignore", "ignore", "pipe"],
    },
  );
  let output = "";
  server.stderr.on("data", (chunk) => {
    output = (output + chunk).slice(-5000);
  });
  process.on("exit", () => {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      /* Already stopped. */
    }
  });
  let started = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      if ((await fetch(base)).ok) {
        started = true;
        break;
      }
    } catch {
      /* Wait for the server. */
    }
    if (server.exitCode !== null) throw new Error(output);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  assert.ok(started, output || "The test server did not start.");
}

async function request(route, options) {
  const response = await fetch(`${base}${route}`, {
    ...options,
    headers: { ...options?.headers, cookie },
  });
  const result = await response.json();
  assert.ok(response.ok, result.error);
  return result;
}

const page = await fetch(base);
assert.equal(page.status, 200);
assert.ok((await page.text()).includes("Your next big thing."));
const guarded = await fetch(`${base}/dashboard`, { redirect: "manual" });
assert.equal(guarded.status, 307);
assert.ok(guarded.headers.get("location").endsWith("/login"));
for (const [route, method] of [
  ["/api/dashboard", "GET"],
  ["/api/deployments", "POST"],
  ["/api/setup", "POST"],
  ["/api/applications/123456789abc", "GET"],
  ["/api/applications/123456789abc", "POST"],
]) {
  assert.equal((await fetch(`${base}${route}`, { method })).status, 401);
}
console.log(
  "Homepage is serving; dashboard and all Docker APIs reject unauthenticated requests.",
);

if (process.argv.includes("--auth")) {
  const password = randomBytes(24).toString("base64url");
  const email = "smoke-owner@example.test";
  const signup = await fetch(`${base}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify({ name: "Smoke owner", email, password }),
  });
  assert.equal(signup.status, 200, await signup.clone().text());
  cookie = signup.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  assert.ok(cookie);
  const dashboardPage = await fetch(`${base}/dashboard`, {
    headers: { cookie },
    redirect: "manual",
  });
  assert.equal(dashboardPage.status, 200);
  const second = await fetch(`${base}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify({
      name: "Other owner",
      email: "other@example.test",
      password,
    }),
  });
  assert.ok(second.status >= 400);
  await request("/api/auth/sign-out", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base },
    body: "{}",
  });
  assert.equal(
    (await fetch(`${base}/api/dashboard`, { headers: { cookie } })).status,
    401,
  );
  const login = await fetch(`${base}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(login.status, 200, await login.clone().text());
  cookie = login.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  console.log(
    "Isolated owner registration, protected dashboard, closed registration, sign-out and sign-in passed.",
  );
}

const forbidden = await fetch(`${base}/api/deployments`, {
  method: "POST",
  headers: {
    Origin: "https://untrusted.example",
    "Content-Type": "application/json",
  },
  body: "{}",
});
assert.equal(forbidden.status, 403);
if (cookie) {
  const invalid = await fetch(`${base}/api/deployments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ name: "../invalid" }),
  });
  assert.equal(invalid.status, 400);
  console.log("Cross-origin and invalid deployment requests rejected.");
}

if (process.argv.includes("--deploy")) {
  assert.ok(
    cookie,
    "Use --auth with --deploy to create an isolated test session.",
  );
  const dashboard = await request("/api/dashboard");
  assert.ok(
    dashboard.docker.connected && dashboard.buildkit,
    "Docker and BuildKit must be running for the deployment smoke test.",
  );
  const name = `dashboard-check-${Date.now()}`;
  const job = await request("/api/deployments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      source: "examples/node-vite-react",
      port: 3000,
      healthPath: "/",
      environment: "",
    }),
  });
  console.log(`Building test deployment ${job.id}…`);
  const deadline = Date.now() + 5 * 60 * 1000;
  let finished;
  while (Date.now() < deadline) {
    const state = await request("/api/dashboard");
    const current = state.deployments.find((item) => item.id === job.id);
    if (current?.status === "failed") throw new Error(current.logs);
    if (current?.status === "ready") {
      finished = current;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  assert.ok(
    finished?.url,
    "Deployment did not become ready within five minutes.",
  );
  const appResponse = await fetch(finished.url);
  assert.equal(appResponse.status, 200);
  const state = await request("/api/dashboard");
  const application = state.applications.find((item) => item.name === name);
  assert.ok(application, "The deployed app should appear in the dashboard.");
  assert.equal(
    typeof (await request(`/api/applications/${application.id}`)).logs,
    "string",
  );
  await request(`/api/applications/${application.id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "stop" }),
  });
  console.log(
    `Deployment served HTTP 200 at ${finished.url}; runtime logs worked; test container stopped.`,
  );
}

if (cookie)
  await request("/api/auth/sign-out", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base },
    body: "{}",
  });
if (server) {
  process.kill(-server.pid, "SIGTERM");
  await new Promise((resolve) => server.on("close", resolve));
}
