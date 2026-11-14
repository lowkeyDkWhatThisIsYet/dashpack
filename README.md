# Dashpack

Dashpack detects an application's language and dependencies, generates a build plan, and uses BuildKit to turn the source into a container image. It is based on [Railpack](https://github.com/railwayapp/railpack) at `f52ebcd0` and retains its MIT license.

## Build locally

Use Go 1.26.8 or newer.

```sh
go build -buildvcs=false -o bin/dashpack ./cmd/cli
./bin/dashpack --help
./bin/dashpack plan /path/to/app
```

## Build an application image

With Docker running, start a BuildKit container and point Dashpack at it.

```sh
docker run --rm --privileged -d --name dashpack-buildkit moby/buildkit
export BUILDKIT_HOST=docker-container://dashpack-buildkit
./bin/dashpack build /path/to/app --name my-app
```

Dashpack uses Railpack's published builder and runtime images by default. The frontend Dockerfile under `images/alpine/frontend` builds the Dashpack BuildKit frontend.

## Run a local deployment

With Docker and BuildKit running, deploy a local project without writing a Dockerfile:

```sh
mise run cli -- deploy examples/node-vite-react --name my-app
```

Dashpack builds an image, starts a container, and prints a local URL after an HTTP readiness check succeeds. The app receives `PORT=3000`; use `--port` for apps that require another port, `--health-path` for a readiness endpoint, and `--env KEY=value` for application variables. The startup timeout defaults to 90 seconds.

Each deployment gets its own container and loopback port. Failed candidates are removed; previous deployments keep running. Successful deployments also leave previous containers running. Use `docker ps --filter label=com.dashpack.app=my-app` to find them and Docker's logs/stop commands to manage them. The CLI accepts local folders; the web dashboard below also imports public GitHub repositories. Stable routing, HTTPS, and automatic replacement are not implemented yet.

## Web dashboard (Next.js)

The local dashboard lets you deploy projects, follow build logs, open app URLs, and start or stop Dashpack containers from your browser.

```sh
cd web
npm ci
npm run dev
```

Open **http://127.0.0.1:3001** for the public homepage. Select **Get started** to create the workspace owner account using your name, email, and a password of at least 12 characters. Future visits use **Log in**. The signed-in dashboard lives at **/dashboard**; dashboard pages and Docker APIs require a valid session.

Keep Docker Desktop running. If BuildKit is unavailable, select **Start build engine** in the dashboard setup banner to create or start the privileged `buildkit` container. Existing apps created with the CLI appear automatically.

1. Select **New application**.
2. Choose a public GitHub repository URL or a local project folder. Relative folders are resolved from the Dashpack repository, so `examples/node-vite-react` works out of the box.
3. Enter a lowercase application name. Optionally set environment variables, the internal port, and the health check path in **Advanced settings**.
4. Select **Deploy application** and follow the build output. Open the application when its status becomes **Live**.
5. Use the terminal icon for runtime logs and the stop/start control to manage containers.

Each deployment has a separate local URL. Previous containers remain running until you stop them. Public GitHub repositories use their default branch; private repositories, push-triggered builds, stable domains, HTTPS, and team accounts are not available yet.

The Node server must run on the Docker host with `docker`, `git`, and `mise` on its PATH. It launches the existing `mise run cli` task. Deployment history and redacted build logs are stored in ignored `web/.data/`; environment values are passed to the worker in memory, although Docker stores runtime environment variables as usual. Cloned sources and built images are retained locally.

Authentication uses Better Auth with a local SQLite database, hashed passwords, HTTP-only session cookies, and rate limiting. The first account owns this Docker workspace; registration closes afterward, including at the database level. Auth data and an automatically generated persistent session secret live in ignored `web/.data/auth/`. Back up this directory to retain the account and sessions; `BETTER_AUTH_SECRET` can supply a managed secret instead. Email verification and password-reset emails are not configured. Keep the server on localhost: this version does not provide public hosting or isolation between tenants.

For a production-mode local dashboard, run `npm run build` followed by `npm start` inside `web`. For dashboard checks, run `npm test` and `npm run typecheck`. After a production build, `npm run smoke -- --auth` starts an isolated test server on port 3002 and tests the homepage, registration, login, logout, and protected routes. Its test account is stored under `tmp/`, leaving the real workspace owner unclaimed. Add `--deploy` to exercise an actual example deployment and stop its test container afterward.

## Configure an application

Dashpack reads `dashpack.json` first and falls back to `railpack.json`. Use `--config-file` to select a file explicitly, or pass `--env DASHPACK_CONFIG_FILE=path.json` to override that flag. Configuration variables passed with `--env` accept the `DASHPACK_` and `RAILPACK_` prefixes. If you supply both for the same setting, Dashpack uses the `DASHPACK_` value.

```sh
./bin/dashpack plan /path/to/app --env 'DASHPACK_START_CMD=node server.js'
```

The build plan and configuration schema are compatible with [Railpack's documentation](https://railpack.com/).
