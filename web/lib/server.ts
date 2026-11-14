import "server-only";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, readdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Application, Dashboard, Deployment, DeployInput } from "./types";

const execute = promisify(execFile);
export const root = path.resolve(
  process.env.DASHPACK_ROOT || path.join(process.cwd(), ".."),
);
const data = path.join(root, "web", ".data");
const jobsDirectory = path.join(data, "deployments");

async function docker(args: string[]) {
  const { stdout } = await execute("docker", args, {
    timeout: 15000,
    maxBuffer: 2 * 1024 * 1024,
  });
  return stdout;
}

export async function deployments(): Promise<Deployment[]> {
  await mkdir(jobsDirectory, { recursive: true });
  const files = (await readdir(jobsDirectory)).filter((name) =>
    name.endsWith(".json"),
  );
  const records = await Promise.all(
    files.map(async (file) => {
      try {
        const record = JSON.parse(
          await readFile(path.join(jobsDirectory, file), "utf8"),
        ) as Deployment & { pid?: number };
        // A restarted dashboard can still read a detached worker's progress.
        if (record.status === "building" && record.pid) {
          try {
            process.kill(record.pid, 0);
          } catch {
            record.status = "failed";
            record.logs =
              "The deployment worker stopped before finishing. Start a new deployment.";
          }
        }
        let logs = "";
        try {
          logs = await readFile(
            path.join(jobsDirectory, `${record.id}.log`),
            "utf8",
          );
        } catch {
          /* Worker has not emitted output yet. */
        }
        const { pid: _pid, ...publicRecord } = record;
        return {
          ...publicRecord,
          logs: (logs + (record.logs || "")).slice(-60000),
        };
      } catch {
        return null;
      }
    }),
  );
  return records
    .filter((record): record is Deployment => record !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50);
}

export async function dashboard(): Promise<Dashboard> {
  const history = await deployments();
  try {
    const [output, buildkit] = await Promise.all([
      docker([
        "ps",
        "-a",
        "--filter",
        "label=com.dashpack.app",
        "--format",
        "{{json .}}",
      ]),
      docker(["ps", "--filter", "name=^/buildkit$", "--format", "{{.ID}}"]),
    ]);
    const applications: Application[] = output
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const item = JSON.parse(line);
        const label = String(item.Labels)
          .split(",")
          .find((value) => value.startsWith("com.dashpack.app="));
        const published = String(item.Ports).match(/127\.0\.0\.1:(\d+)->/);
        return {
          id: item.ID,
          name: label?.slice("com.dashpack.app=".length) || item.Names,
          container: item.Names,
          state: item.State,
          status: item.Status,
          image: item.Image,
          ports: item.Ports,
          url:
            item.State === "running" && published
              ? `http://127.0.0.1:${published[1]}`
              : undefined,
        };
      });
    return {
      applications,
      deployments: history,
      docker: { connected: true },
      buildkit: Boolean(buildkit.trim()),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Docker is unavailable.";
    return {
      applications: [],
      deployments: history,
      docker: { connected: false, error: message },
      buildkit: false,
    };
  }
}

export async function createDeployment(input: DeployInput) {
  if (!input.source.startsWith("https://")) {
    const source = path.resolve(root, input.source);
    if (!(await stat(source).catch(() => null))?.isDirectory())
      throw new Error(
        "The local project folder does not exist on this machine.",
      );
  }
  const id = randomUUID();
  const record: Deployment = {
    id,
    name: input.name,
    source: input.source,
    status: "building",
    createdAt: new Date().toISOString(),
    logs: "",
  };
  await mkdir(jobsDirectory, { recursive: true });
  await writeFile(
    path.join(jobsDirectory, `${id}.json`),
    JSON.stringify(record),
    { mode: 0o600 },
  );
  // The worker owns durable output and survives browser navigation or reloads.
  const worker = spawn(
    process.execPath,
    [path.join(root, "web", "scripts", "deploy-worker.mjs")],
    {
      cwd: root,
      detached: true,
      stdio: ["pipe", "ignore", "ignore"],
    },
  );
  worker.on("error", async () => {
    await writeFile(
      path.join(jobsDirectory, `${id}.json`),
      JSON.stringify({
        ...record,
        status: "failed",
        logs: "Could not start the deployment worker.",
      }),
    );
  });
  worker.stdin.on("error", () => {
    /* Spawn errors are recorded by the worker error handler. */
  });
  // Environment values travel over stdin and are never stored in deployment metadata.
  worker.stdin.end(JSON.stringify({ input, record, root, data }));
  worker.unref();
  return record;
}

export async function startBuilder() {
  let exists = false;
  try {
    await docker(["container", "inspect", "buildkit"]);
    exists = true;
  } catch {
    /* Create the builder when this host has not been set up yet. */
  }
  if (exists) {
    await docker(["start", "buildkit"]);
    return;
  }
  // The explicit setup action provisions the same privileged builder as the CLI guide.
  await execute(
    "docker",
    [
      "run",
      "--detach",
      "--privileged",
      "--name",
      "buildkit",
      "--volume",
      "dashpack-buildkit-state:/var/lib/buildkit",
      "moby/buildkit",
    ],
    { timeout: 180000 },
  );
}

async function managedContainer(id: string) {
  if (!/^[a-f0-9]{12,64}$/.test(id)) throw new Error("Invalid container ID.");
  const output = await docker([
    "inspect",
    "--format",
    '{{index .Config.Labels "com.dashpack.app"}}',
    id,
  ]);
  if (!output.trim())
    throw new Error("This container is not managed by Dashpack.");
}

export async function containerLogs(id: string) {
  await managedContainer(id);
  const { stdout, stderr } = await execute(
    "docker",
    ["logs", "--tail", "150", "--timestamps", id],
    { timeout: 15000, maxBuffer: 1024 * 1024 },
  );
  return stdout + stderr;
}

export async function containerAction(id: string, action: string) {
  if (action !== "start" && action !== "stop")
    throw new Error("Unsupported container action.");
  await managedContainer(id);
  await docker([action, id]);
}
