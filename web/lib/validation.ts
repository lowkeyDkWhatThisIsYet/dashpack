import type { DeployInput } from "./types";

export function validateDeployment(value: unknown): DeployInput {
  if (!value || typeof value !== "object")
    throw new Error("Deployment settings are required.");
  const input = value as Record<string, unknown>;
  const name = String(input.name ?? "").trim();
  const source = String(input.source ?? "").trim();
  const port = Number(input.port ?? 3000);
  const healthPath = String(input.healthPath ?? "/").trim();
  const environment = String(input.environment ?? "").trim();
  if (!/^[a-z0-9][a-z0-9_-]{0,62}$/.test(name))
    throw new Error(
      "Use a lowercase app name, up to 63 characters, with letters, digits, hyphens or underscores.",
    );
  if (!source || source.length > 2048)
    throw new Error(
      "Enter a local project path or public GitHub repository URL.",
    );
  if (source.startsWith("https://")) {
    if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?\/?$/.test(source))
      throw new Error(
        "Use a public GitHub repository URL such as https://github.com/owner/repo.",
      );
  } else if (source.includes("://") || source.startsWith("-")) {
    throw new Error(
      "Use a local project path or an HTTPS GitHub repository URL.",
    );
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("The app port must be between 1 and 65535.");
  if (
    !healthPath.startsWith("/") ||
    healthPath.startsWith("//") ||
    /[\r\n]/.test(healthPath)
  )
    throw new Error("The health path must start with a single slash.");
  if (environment.length > 32768)
    throw new Error("Environment variables are too large.");
  for (const line of environment.split("\n").filter((line) => line.trim())) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*=/.test(line))
      throw new Error("Enter one KEY=value environment variable per line.");
    if (line.startsWith("PORT="))
      throw new Error(
        "Set the app port in Advanced settings instead of adding PORT.",
      );
  }
  return { name, source, port, healthPath, environment };
}

// Reject cross-site requests before any operation reaches the local Docker daemon.
export function assertLocalRequest(request: Request) {
  const host = request.headers.get("host") ?? "";
  if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host))
    throw new Error("This dashboard is available on localhost only.");
  const origin = request.headers.get("origin");
  if (origin && origin !== `http://${host}`)
    throw new Error("Cross-origin requests are not allowed.");
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new Error("Cross-site requests are not allowed.");
}
