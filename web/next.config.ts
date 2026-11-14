import type { NextConfig } from "next";

const config: NextConfig = {
  // The dashboard needs a Node server on the Docker host.
  serverExternalPackages: ["better-sqlite3"],
};

export default config;
