import { spawn } from "node:child_process";
import { mkdir, writeFile, appendFile, rename } from "node:fs/promises";
import path from "node:path";

let payload = "";
for await (const chunk of process.stdin) payload += chunk;
const { input, record, root, data } = JSON.parse(payload);
const directory = path.join(data, "deployments");
const metadata = path.join(directory, `${record.id}.json`);
const logfile = path.join(directory, `${record.id}.log`);
const secrets = input.environment
  .split("\n")
  .filter(Boolean)
  .map((line) => line.slice(line.indexOf("=") + 1))
  .filter(Boolean);
let readyUrl;
let logBytes = 0;
let writes = Promise.resolve();

function log(value) {
  // Strip terminal control sequences and redact supplied secrets before persistence.
  let text = value.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "");
  for (const secret of secrets) text = text.split(secret).join("[REDACTED]");
  const match = text.match(/Application ready: (http:\/\/127\.0\.0\.1:\d+)/);
  if (match) readyUrl = match[1];
  if (logBytes > 2 * 1024 * 1024) return;
  logBytes += Buffer.byteLength(text);
  writes = writes.then(() => appendFile(logfile, text, { mode: 0o600 }));
}

async function save(status) {
  await writeFile(
    `${metadata}.tmp`,
    JSON.stringify({
      ...record,
      pid: process.pid,
      status,
      url: readyUrl,
      finishedAt: status === "building" ? undefined : new Date().toISOString(),
    }),
    { mode: 0o600 },
  );
  await rename(`${metadata}.tmp`, metadata);
}

function run(command, args, timeout) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      detached: true,
      env: { ...process.env, NO_COLOR: "1", GIT_TERMINAL_PROMPT: "0" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      // Terminate the process group so build subprocesses cannot outlive their timeout.
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        /* Already exited. */
      }
    }, timeout);
    for (const stream of [child.stdout, child.stderr]) {
      stream.setEncoding("utf8");
      let pending = "";
      stream.on("data", (chunk) => {
        pending += chunk;
        const lines = pending.split("\n");
        pending = lines.pop() || "";
        for (const line of lines) log(`${line}\n`);
      });
      stream.on("end", () => {
        if (pending) log(pending);
      });
    }
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else
        reject(
          new Error(
            timedOut
              ? "Deployment timed out after 20 minutes."
              : `${command} exited with code ${code}.`,
          ),
        );
    });
  });
}

try {
  await save("building");
  let source = path.resolve(root, input.source);
  if (input.source.startsWith("https://")) {
    source = path.join(data, "sources", record.id);
    await mkdir(path.dirname(source), { recursive: true });
    log(`Cloning ${input.source}\n`);
    await run(
      "git",
      ["clone", "--depth", "1", "--", input.source, source],
      120000,
    );
  }
  log("Detecting framework and building your application…\n");
  const args = [
    "run",
    "cli",
    "--",
    "deploy",
    source,
    "--name",
    input.name,
    "--port",
    String(input.port),
    "--health-path",
    input.healthPath,
  ];
  for (const line of input.environment
    .split("\n")
    .filter((line) => line.trim()))
    args.push("--env", line);
  await run("mise", args, 20 * 60 * 1000);
  await writes;
  if (!readyUrl)
    throw new Error(
      "The deployment finished without a ready URL. Check the build output.",
    );
  await save("ready");
} catch (error) {
  log(`\nDeployment failed: ${error.message}\n`);
  await writes;
  await save("failed");
}
