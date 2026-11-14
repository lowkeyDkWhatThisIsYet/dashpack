export type Deployment = {
  id: string;
  name: string;
  source: string;
  status: "building" | "ready" | "failed";
  createdAt: string;
  finishedAt?: string;
  url?: string;
  logs: string;
};

export type Application = {
  id: string;
  name: string;
  container: string;
  state: string;
  status: string;
  image: string;
  ports: string;
  url?: string;
};

export type Dashboard = {
  applications: Application[];
  deployments: Deployment[];
  docker: { connected: boolean; error?: string };
  buildkit: boolean;
};

export type DeployInput = {
  name: string;
  source: string;
  port: number;
  healthPath: string;
  environment: string;
};
