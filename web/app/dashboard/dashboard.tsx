"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Code2,
  ExternalLink,
  FolderGit2,
  GitBranch,
  Github,
  Layers3,
  Loader2,
  LogOut,
  Monitor,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Server,
  ShieldCheck,
  Square,
  Terminal,
  X,
} from "lucide-react";
import type { Application, Dashboard, Deployment } from "@/lib/types";

type View = "overview" | "applications" | "deployments";

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...options });
  const result = await response.json();
  if (response.status === 401) window.location.assign("/login");
  if (!response.ok)
    throw new Error(result.error || "Something went wrong. Please try again.");
  return result;
}

function age(value: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(value)) / 60000),
  );
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

function Status({ state }: { state: string }) {
  const label =
    state === "running" || state === "ready"
      ? "Live"
      : state === "building"
        ? "Building"
        : state === "failed"
          ? "Failed"
          : "Stopped";
  return (
    <span className={`status ${label.toLowerCase()}`}>
      <span />
      {label}
    </span>
  );
}

export default function Home({
  user,
}: {
  user: { name: string; email: string };
}) {
  const [view, setView] = useState<View>("overview");
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [showDeploy, setShowDeploy] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [runtimeLogs, setRuntimeLogs] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [settingUp, setSettingUp] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setData(await api<Dashboard>("/api/dashboard"));
      setError("");
    } catch (error) {
      setError((error as Error).message);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 4000);
    return () => clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (!selectedApp) return;
    let active = true;
    const load = async () => {
      try {
        const result = await api<{ logs: string }>(
          `/api/applications/${selectedApp.id}`,
        );
        if (active) setRuntimeLogs(result.logs || "No runtime output yet.");
      } catch (error) {
        if (active) setRuntimeLogs((error as Error).message);
      }
    };
    void load();
    const timer = setInterval(() => void load(), 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [selectedApp]);

  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowDeploy(false);
        setShowGuide(false);
        setSelectedJob(null);
        setSelectedApp(null);
      }
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, []);

  async function action(app: Application) {
    const operation = app.state === "running" ? "stop" : "start";
    if (
      operation === "stop" &&
      !window.confirm(`Stop ${app.name}? Its current URL will stop serving.`)
    )
      return;
    setBusy(app.id);
    try {
      await api(`/api/applications/${app.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: operation }),
      });
      await refresh();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function setupBuilder() {
    setSettingUp(true);
    try {
      await api("/api/setup", { method: "POST" });
      await refresh();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setSettingUp(false);
    }
  }

  async function signOut() {
    try {
      await api("/api/auth/sign-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      window.location.assign("/login");
    } catch (error) {
      setError((error as Error).message);
    }
  }

  const applications = data?.applications ?? [];
  const deployments = data?.deployments ?? [];
  const live = applications.filter((app) => app.state === "running").length;
  const building = deployments.filter(
    (job) => job.status === "building",
  ).length;
  const failed = deployments.filter((job) => job.status === "failed").length;
  const matchingApps = applications.filter(
    (app) =>
      app.name.toLowerCase().includes(query.toLowerCase()) &&
      (filter === "all" ||
        (filter === "live"
          ? app.state === "running"
          : app.state !== "running")),
  );
  const matchingJobs = deployments.filter(
    (job) =>
      `${job.name} ${job.source}`.toLowerCase().includes(query.toLowerCase()) &&
      (filter === "all" ||
        (filter === "live" ? job.status === "ready" : job.status === filter)),
  );
  const job = deployments.find((item) => item.id === selectedJob);

  return (
    <div className="workspace">
      <aside className="sidebar">
        <a href="/" className="brand" aria-label="Dashpack home">
          <span className="brand-mark">
            <Layers3 size={21} strokeWidth={2.5} />
          </span>
          dashpack<span className="brand-period">.</span>
        </a>
        <div className="workspace-switch">
          <span className="avatar">D</span>
          <span>
            <strong>My workspace</strong>
            <small>Local development</small>
          </span>
          <ChevronDown size={15} />
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav aria-label="Main navigation">
          <button
            className={view === "overview" ? "active" : ""}
            onClick={() => {
              setView("overview");
              setFilter("all");
            }}
          >
            <Layers3 size={18} />
            Overview
          </button>
          <button
            className={view === "applications" ? "active" : ""}
            onClick={() => {
              setView("applications");
              setFilter("all");
            }}
          >
            <Box size={18} />
            Applications<span className="nav-count">{applications.length}</span>
          </button>
          <button
            className={view === "deployments" ? "active" : ""}
            onClick={() => {
              setView("deployments");
              setFilter("all");
            }}
          >
            <Rocket size={18} />
            Deployments
            {building > 0 && <span className="nav-count">{building}</span>}
          </button>
        </nav>
        <div className="sidebar-note">
          <span className="eyebrow">
            <span className="tiny-dot" /> YOUR LOCAL CLOUD
          </span>
          <strong>From code to running.</strong>
          <p>
            Your projects. Your machine.
            <br />A lot less configuration.
          </p>
          <button onClick={() => setShowGuide(true)}>
            Quick start guide <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <button onClick={() => setShowGuide(true)}>
            <CircleHelp size={18} />
            Help & getting started
            <ArrowUpRight size={14} />
          </button>
          <div className="profile">
            <span className="profile-avatar">
              <Monitor size={17} />
            </span>
            <span>
              <strong>{user.name}</strong>
              <small>Workspace owner</small>
            </span>
            <button
              className="icon-button"
              aria-label="Sign out"
              title="Sign out"
              onClick={() => void signOut()}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            My workspace <ChevronRight size={13} />
            <strong>{view[0].toUpperCase() + view.slice(1)}</strong>
          </div>
          <div className="topbar-right">
            <span className="local-badge">
              <Monitor size={13} />
              Local workspace
            </span>
            <button
              className="icon-button"
              aria-label="Refresh dashboard"
              onClick={() => void refresh()}
            >
              <RefreshCw size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="Sign out of workspace"
              title="Sign out"
              onClick={() => void signOut()}
            >
              <LogOut size={16} />
            </button>
            <span className="top-avatar" title={user.email}>
              {user.name[0]?.toUpperCase() || "D"}
            </span>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">YOUR DEPLOYMENT WORKSPACE</div>
              <h1>
                {view === "overview"
                  ? "Let’s ship something."
                  : view === "applications"
                    ? "Your applications."
                    : "Every deploy, in one place."}
              </h1>
              <p>
                {view === "overview"
                  ? "From your next idea to your next live app. All in one place."
                  : view === "applications"
                    ? "See what’s running and keep your services moving."
                    : "Follow builds from source code to a running application."}
              </p>
            </div>
            <button className="primary" onClick={() => setShowDeploy(true)}>
              <Plus size={17} />
              New application
            </button>
          </div>

          {error && (
            <div role="alert" className="error-banner">
              {error}
              <button
                className="icon-button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                <X size={15} />
              </button>
            </div>
          )}
          {data && (!data.docker.connected || !data.buildkit) && (
            <div className="setup-banner">
              <Server size={19} />
              <div>
                <strong>
                  {!data.docker.connected
                    ? "Connect your Docker engine"
                    : "BuildKit isn’t running yet"}
                </strong>
                <p>
                  {!data.docker.connected
                    ? "Start Docker Desktop to see your apps and deploy a project."
                    : "Set up the privileged Docker build engine on this machine. The first setup may download its image."}
                </p>
              </div>
              {data.docker.connected ? (
                <button
                  disabled={settingUp}
                  onClick={() => void setupBuilder()}
                >
                  {settingUp ? (
                    <>
                      <Loader2 size={15} className="spin" />
                      Starting builder…
                    </>
                  ) : (
                    <>
                      Start build engine <ArrowRight size={15} />
                    </>
                  )}
                </button>
              ) : (
                <button onClick={() => setShowGuide(true)}>
                  View setup <ArrowRight size={15} />
                </button>
              )}
            </div>
          )}

          <section className="stats" aria-label="Workspace statistics">
            {[
              {
                title: "Applications",
                number: applications.length,
                icon: Box,
                detail: "Containers in your workspace",
                color: "blue",
              },
              {
                title: "Live now",
                number: live,
                icon: Activity,
                detail: "Up and running",
                color: "green",
              },
              {
                title: "Building",
                number: building,
                icon: Rocket,
                detail: "On their way to live",
                color: "amber",
              },
              {
                title: "Failed deploys",
                number: failed,
                icon: Terminal,
                detail: "Check logs to find a fix",
                color: "neutral",
              },
            ].map((stat) => (
              <div className="stat" key={stat.title}>
                <div className="stat-top">
                  <span>{stat.title}</span>
                  <stat.icon size={17} className={stat.color} />
                </div>
                <strong>{data ? stat.number : "—"}</strong>
                <small>
                  <span className={`tiny-dot ${stat.color}`} />
                  {stat.detail}
                </small>
              </div>
            ))}
          </section>

          {view === "overview" && (
            <section className="ship-banner">
              <div>
                <span className="banner-label">
                  <GitBranch size={13} /> LESS SETUP. MORE SHIPPING.
                </span>
                <h2>Your code is ready for its next home.</h2>
                <p>
                  Choose a project. We’ll figure out how to build and run it.
                </p>
                <button onClick={() => setShowDeploy(true)}>
                  Deploy a project <ArrowRight size={16} />
                </button>
              </div>
              <div className="pipeline" aria-hidden="true">
                <div className="pipeline-node">
                  <Code2 size={25} />
                  <small>Your code</small>
                </div>
                <span className="pipeline-line" />
                <div className="pipeline-node node-build">
                  <Layers3 size={25} />
                  <small>Auto build</small>
                </div>
                <span className="pipeline-line" />
                <div className="pipeline-node node-live">
                  <Rocket size={25} />
                  <small>It’s live</small>
                </div>
                <span className="pipeline-check">
                  <Check size={12} />
                </span>
              </div>
            </section>
          )}

          <section className="content-section">
            <div className="section-heading">
              <div>
                <h2>
                  {view === "deployments"
                    ? "Deployment activity"
                    : "Applications"}
                  <span className="number-badge">
                    {view === "deployments"
                      ? deployments.length
                      : applications.length}
                  </span>
                </h2>
                <p>
                  {view === "deployments"
                    ? "Build output and readiness checks for every deployment."
                    : "A little overview of everything you’re building."}
                </p>
              </div>
              <label className="search">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={
                    view === "deployments"
                      ? "Search deployments…"
                      : "Search applications…"
                  }
                  aria-label="Search"
                />
              </label>
            </div>
            <div className="table-panel">
              <div className="table-toolbar">
                <div className="tabs">
                  {(view === "deployments"
                    ? ["all", "live", "building", "failed"]
                    : ["all", "live", "stopped"]
                  ).map((item) => (
                    <button
                      key={item}
                      className={filter === item ? "selected" : ""}
                      onClick={() => setFilter(item)}
                    >
                      {item === "all"
                        ? "All"
                        : item[0].toUpperCase() + item.slice(1)}
                      {item === "all" && (
                        <span>
                          {view === "deployments"
                            ? deployments.length
                            : applications.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <span className="refresh-note">
                  <span className="tiny-dot" />
                  Updates automatically
                </span>
              </div>
              {!data ? (
                <div className="empty">
                  <Loader2 className="spin" size={26} />
                  <h3>Connecting to your workspace</h3>
                  <p>Checking Docker and loading your applications…</p>
                </div>
              ) : view === "deployments" ? (
                matchingJobs.length ? (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Application</th>
                          <th>Status</th>
                          <th>Source</th>
                          <th>Created</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {matchingJobs.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <button
                                className="app-name"
                                onClick={() => setSelectedJob(item.id)}
                              >
                                <span className="app-icon">
                                  <Rocket size={18} />
                                </span>
                                <span>
                                  <strong>{item.name}</strong>
                                  <small>{item.id.slice(0, 8)}</small>
                                </span>
                              </button>
                            </td>
                            <td>
                              <Status state={item.status} />
                            </td>
                            <td className="source-cell" title={item.source}>
                              <FolderGit2 size={14} />
                              {item.source}
                            </td>
                            <td className="muted nowrap">
                              {age(item.createdAt)}
                            </td>
                            <td>
                              <button
                                className="text-button"
                                onClick={() => setSelectedJob(item.id)}
                              >
                                View logs <ArrowUpRight size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty
                    search={Boolean(query || filter !== "all")}
                    deploy={() => setShowDeploy(true)}
                    deployments
                  />
                )
              ) : matchingApps.length ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Application</th>
                        <th>Status</th>
                        <th>Endpoint</th>
                        <th>Runtime</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {matchingApps.map((app) => (
                        <tr key={app.id}>
                          <td>
                            <button
                              className="app-name"
                              onClick={() => {
                                setSelectedApp(app);
                                setRuntimeLogs("Loading runtime logs…");
                              }}
                            >
                              <span className="app-icon">
                                <Box size={18} />
                              </span>
                              <span>
                                <strong>{app.name}</strong>
                                <small>{app.id}</small>
                              </span>
                            </button>
                          </td>
                          <td>
                            <Status state={app.state} />
                          </td>
                          <td>
                            {app.url ? (
                              <a
                                className="endpoint"
                                href={app.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {app.url.replace("http://", "")}
                                <ExternalLink size={12} />
                              </a>
                            ) : (
                              <span className="muted">No active endpoint</span>
                            )}
                          </td>
                          <td className="muted nowrap">{app.status}</td>
                          <td>
                            <div className="row-actions">
                              <button
                                className="icon-button"
                                aria-label={`View ${app.name} logs`}
                                title="Runtime logs"
                                onClick={() => {
                                  setSelectedApp(app);
                                  setRuntimeLogs("Loading runtime logs…");
                                }}
                              >
                                <Terminal size={16} />
                              </button>
                              <button
                                className="icon-button"
                                disabled={busy === app.id}
                                aria-label={`${app.state === "running" ? "Stop" : "Start"} ${app.name}`}
                                onClick={() => void action(app)}
                              >
                                {busy === app.id ? (
                                  <Loader2 size={15} className="spin" />
                                ) : app.state === "running" ? (
                                  <Square size={14} />
                                ) : (
                                  <Play size={15} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  search={Boolean(query || filter !== "all")}
                  deploy={() => setShowDeploy(true)}
                />
              )}
            </div>
          </section>

          {view === "overview" && (
            <section className="bottom-grid">
              <div className="activity-card">
                <div className="card-heading">
                  <h2>Recent deployments</h2>
                  <button
                    className="text-button"
                    onClick={() => {
                      setView("deployments");
                      setFilter("all");
                    }}
                  >
                    View all <ArrowRight size={14} />
                  </button>
                </div>
                {deployments.length ? (
                  deployments.slice(0, 3).map((item) => (
                    <button
                      className="activity-item"
                      key={item.id}
                      onClick={() => setSelectedJob(item.id)}
                    >
                      <span className={`activity-symbol ${item.status}`}>
                        {item.status === "ready" ? (
                          <Check size={16} />
                        ) : item.status === "building" ? (
                          <Loader2 size={16} className="spin" />
                        ) : (
                          <X size={16} />
                        )}
                      </span>
                      <span>
                        <strong>{item.name}</strong>
                        <small>
                          {item.status === "ready"
                            ? "Deployment is live"
                            : item.status === "failed"
                              ? "Build needs attention"
                              : "Building application"}
                        </small>
                      </span>
                      <time>{age(item.createdAt)}</time>
                    </button>
                  ))
                ) : (
                  <div className="quiet-state">
                    <GitBranch size={20} />
                    <div>
                      <strong>Your next deploy starts here.</strong>
                      <p>Build activity will appear as you ship.</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="engine-card">
                <div className="card-heading">
                  <h2>Your deployment engine</h2>
                  <Server size={17} />
                </div>
                <div className="engine-row">
                  <span>
                    <span
                      className={`tiny-dot ${data?.docker.connected ? "green" : "neutral"}`}
                    />
                    Docker engine
                  </span>
                  <strong>
                    {data
                      ? data.docker.connected
                        ? "Connected"
                        : "Disconnected"
                      : "Checking…"}
                  </strong>
                </div>
                <div className="engine-row">
                  <span>
                    <span
                      className={`tiny-dot ${data?.buildkit ? "green" : "neutral"}`}
                    />
                    BuildKit builder
                  </span>
                  <strong>
                    {data
                      ? data.buildkit
                        ? "Ready to build"
                        : "Not running"
                      : "Checking…"}
                  </strong>
                </div>
                <div className="engine-foot">
                  <ShieldCheck size={14} />
                  Runs on your machine. Accessible locally.
                </div>
              </div>
            </section>
          )}
          <footer>
            <span>
              <span className="footer-mark">✳</span> A small push. A big
              possibility.
            </span>
            <button onClick={() => setShowGuide(true)}>
              Built with Dashpack <ArrowUpRight size={12} />
            </button>
          </footer>
        </main>
      </div>

      {showDeploy && (
        <DeployDialog
          onClose={() => setShowDeploy(false)}
          onCreated={(id) => {
            setShowDeploy(false);
            setSelectedJob(id);
            void refresh();
          }}
          connected={Boolean(data?.docker.connected && data?.buildkit)}
        />
      )}
      {selectedJob && (
        <Modal
          title={job?.name ?? "Deployment"}
          subtitle="DEPLOYMENT LOGS"
          close={() => setSelectedJob(null)}
          wide
        >
          <div className="log-toolbar">
            {job ? (
              <Status state={job.status} />
            ) : (
              <span>Loading deployment…</span>
            )}
            {job?.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noreferrer"
                className="text-button"
              >
                Open application <ExternalLink size={14} />
              </a>
            )}
          </div>
          <pre className="logs" aria-live="polite">
            {job?.logs || "Waiting for build output…"}
          </pre>
          <p className="dialog-note">
            Build output updates automatically. Failed candidates leave existing
            deployments running.
          </p>
        </Modal>
      )}
      {selectedApp && (
        <Modal
          title={selectedApp.name}
          subtitle="RUNTIME LOGS"
          close={() => setSelectedApp(null)}
          wide
        >
          <div className="log-toolbar">
            <code>{selectedApp.container}</code>
            <span className="muted">Last 150 lines · refreshes every 3s</span>
          </div>
          <pre className="logs" aria-live="polite">
            {runtimeLogs}
          </pre>
        </Modal>
      )}
      {showGuide && (
        <Modal
          title="From code to live."
          subtitle="QUICK START"
          close={() => setShowGuide(false)}
        >
          <div className="guide-step">
            <span>1</span>
            <div>
              <h3>Start Docker Desktop</h3>
              <p>
                The dashboard manages containers on this machine. Keep Docker
                running while you use your apps.
              </p>
            </div>
          </div>
          <div className="guide-step">
            <span>2</span>
            <div>
              <h3>Start the build engine once</h3>
              <p>If BuildKit is not available, run this in a terminal:</p>
              <pre className="setup-code">
                docker run -d --privileged --name buildkit \\
                <br /> -v dashpack-buildkit-state:/var/lib/buildkit \\
                <br /> moby/buildkit
              </pre>
              <p>
                If it already exists, use <code>docker start buildkit</code>.
              </p>
            </div>
          </div>
          <div className="guide-step">
            <span>3</span>
            <div>
              <h3>Deploy your project</h3>
              <p>
                Choose New application, enter a public GitHub URL or a folder
                path on this machine, and select Deploy. We detect the runtime
                and build commands.
              </p>
            </div>
          </div>
          <div className="guide-step">
            <span>4</span>
            <div>
              <h3>Open it. Watch it. Ship again.</h3>
              <p>
                Open the URL once the app is live. Select the terminal icon for
                runtime logs. Each new deployment gets a separate URL; stop old
                containers when you’re done.
              </p>
            </div>
          </div>
          <div className="info-note">
            <Monitor size={17} />
            <span>
              This version is a local operator dashboard. Public access, private
              GitHub repos, domains and team accounts are coming later.
            </span>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Empty({
  search,
  deploy,
  deployments = false,
}: {
  search: boolean;
  deploy: () => void;
  deployments?: boolean;
}) {
  return (
    <div className="empty">
      <div className="empty-art">
        <Box size={27} />
        <span>
          <Plus size={12} />
        </span>
      </div>
      <h3>
        {search
          ? "No matches just yet."
          : deployments
            ? "A clean slate for your next launch."
            : "Big ideas start with a first deploy."}
      </h3>
      <p>
        {search
          ? "Try another search or switch back to All."
          : "Bring a project. We’ll handle the build and get it running."}
      </p>
      {!search && (
        <button className="secondary" onClick={deploy}>
          <Plus size={15} />
          Deploy your first app
        </button>
      )}
    </div>
  );
}

function Modal({
  title,
  subtitle,
  close,
  children,
  wide = false,
}: {
  title: string;
  subtitle: string;
  close: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !dialog.current) return;
      const elements = Array.from(
        dialog.current.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input, textarea, a[href], summary",
        ),
      ).filter((element) => element.getClientRects().length > 0);
      const first = elements[0],
        last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        ref={dialog}
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="modal-heading">
          <div>
            <span className="eyebrow">{subtitle}</span>
            <h2>{title}</h2>
          </div>
          <button
            className="icon-button"
            onClick={close}
            aria-label="Close dialog"
            autoFocus
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function DeployDialog({
  onClose,
  onCreated,
  connected,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
  connected: boolean;
}) {
  const [kind, setKind] = useState<"github" | "local">("github");
  const [source, setSource] = useState("");
  const [name, setName] = useState("");
  const [port, setPort] = useState("3000");
  const [healthPath, setHealthPath] = useState("/");
  const [environment, setEnvironment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const record = await api<Deployment>("/api/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          source,
          port: Number(port),
          healthPath,
          environment,
        }),
      });
      onCreated(record.id);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <Modal
      title="Give your code a home."
      subtitle="NEW APPLICATION"
      close={onClose}
    >
      <p className="dialog-intro">
        Pick your source. Dashpack takes care of the build.
      </p>
      <form onSubmit={submit}>
        <div className="source-options">
          <button
            type="button"
            className={kind === "github" ? "selected" : ""}
            onClick={() => {
              setKind("github");
              setSource("");
            }}
          >
            <Github size={19} />
            GitHub repository{kind === "github" && <Check size={14} />}
          </button>
          <button
            type="button"
            className={kind === "local" ? "selected" : ""}
            onClick={() => {
              setKind("local");
              setSource("");
            }}
          >
            <FolderGit2 size={19} />
            Local project{kind === "local" && <Check size={14} />}
          </button>
        </div>
        <label className="field">
          {kind === "github" ? "Repository URL" : "Project folder"}
          <input
            required
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder={
              kind === "github"
                ? "https://github.com/you/your-project"
                : "examples/node-vite-react"
            }
          />
          <small>
            {kind === "github"
              ? "Public repositories only. The default branch is deployed."
              : "An absolute path, or a path relative to the Dashpack repository."}
          </small>
        </label>
        <label className="field">
          Application name
          <input
            required
            pattern="[a-z0-9][a-z0-9_\-]{0,62}"
            maxLength={63}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="my-next-big-thing"
          />
          <small>Lowercase letters, numbers, hyphens and underscores.</small>
        </label>
        <details className="advanced">
          <summary>
            Advanced settings <ChevronDown size={15} />
          </summary>
          <div className="field-grid">
            <label className="field">
              App port
              <input
                required
                type="number"
                min={1}
                max={65535}
                value={port}
                onChange={(event) => setPort(event.target.value)}
              />
            </label>
            <label className="field">
              Health check path
              <input
                required
                value={healthPath}
                onChange={(event) => setHealthPath(event.target.value)}
              />
            </label>
          </div>
          <label className="field">
            Environment variables
            <textarea
              rows={4}
              value={environment}
              onChange={(event) => setEnvironment(event.target.value)}
              placeholder={"DATABASE_URL=postgresql://…\nAPP_ENV=production"}
              spellCheck={false}
            />
            <small>
              One KEY=value per line. PORT is set from the app port above.
            </small>
          </label>
        </details>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {!connected && (
          <div className="info-note">
            <Server size={17} />
            <span>
              Start Docker and BuildKit first. See the quick start guide for
              setup.
            </span>
          </div>
        )}
        <div className="form-footer">
          <span>
            <ShieldCheck size={14} />
            Deployed on this machine
          </span>
          <button
            className="primary"
            type="submit"
            disabled={submitting || !connected}
          >
            {submitting ? (
              <Loader2 size={16} className="spin" />
            ) : (
              <Rocket size={16} />
            )}
            {submitting ? "Starting…" : "Deploy application"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
