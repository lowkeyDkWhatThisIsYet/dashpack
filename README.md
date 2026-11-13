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

## Configure an application

Dashpack reads `dashpack.json` first and falls back to `railpack.json`. Use `--config-file` to select a file explicitly, or pass `--env DASHPACK_CONFIG_FILE=path.json` to override that flag. Configuration variables passed with `--env` accept the `DASHPACK_` and `RAILPACK_` prefixes. If you supply both for the same setting, Dashpack uses the `DASHPACK_` value.

```sh
./bin/dashpack plan /path/to/app --env 'DASHPACK_START_CMD=node server.js'
```

The build plan and configuration schema are compatible with [Railpack's documentation](https://railpack.com/).
