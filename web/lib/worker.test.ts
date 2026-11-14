import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { randomUUID } from "node:crypto";

async function workerFixture(exitCode: number) {
  // Fake only the CLI boundary; exercise the real detached worker and durable output.
  const root = path.resolve(process.cwd(), "..");
  await mkdir(path.join(root, "tmp"), { recursive: true });
  const fixture = await mkdtemp(path.join(root, "tmp", "dashboard-worker-"));
  const data = path.join(fixture, "data");
  await mkdir(path.join(data, "deployments"), { recursive: true });
  await writeFile(
    path.join(fixture, "mise"),
    `#!/usr/bin/env node\nconsole.log("token=super-secret-value");\n${exitCode === 0 ? 'console.log("Application ready: http://127.0.0.1:34567");' : ""}\nprocess.exit(${exitCode});\n`,
    { mode: 0o700 },
  );
  const record = {
    id: randomUUID(),
    name: "test-app",
    source: "examples/node-vite-react",
    status: "building",
    createdAt: new Date().toISOString(),
    logs: "",
  };
  const child = spawn(
    process.execPath,
    [path.join(root, "web", "scripts", "deploy-worker.mjs")],
    {
      env: { ...process.env, PATH: `${fixture}:${process.env.PATH}` },
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  child.stdin.end(
    JSON.stringify({
      root,
      data,
      record,
      input: {
        name: "test-app",
        source: record.source,
        port: 3000,
        healthPath: "/",
        environment: "TOKEN=super-secret-value",
      },
    }),
  );
  let error = "";
  child.stderr.on("data", (value) => {
    error += value;
  });
  await new Promise<void>((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(error)),
    );
  });
  const metadata = await readFile(
    path.join(data, "deployments", `${record.id}.json`),
    "utf8",
  );
  const logs = await readFile(
    path.join(data, "deployments", `${record.id}.log`),
    "utf8",
  );
  assert.ok(!metadata.includes("super-secret-value"));
  assert.ok(!logs.includes("super-secret-value"));
  assert.ok(logs.includes("[REDACTED]"));
  return { record: JSON.parse(metadata), logs };
}

test("worker records readiness URL and redacts supplied secrets", async () => {
  const { record } = await workerFixture(0);
  assert.equal(record.status, "ready");
  assert.equal(record.url, "http://127.0.0.1:34567");
  assert.ok(record.finishedAt);
});

test("worker retains failed build output", async () => {
  const { record, logs } = await workerFixture(1);
  assert.equal(record.status, "failed");
  assert.ok(logs.includes("exited with code 1"));
  assert.equal(record.url, undefined);
});
