# Release Dashpack

The GitHub Actions release workflow runs when you push a `v*` tag. It publishes the builder, runtime, and frontend images under `ghcr.io/<owner>/<repo>-<image>` and attaches Dashpack CLI archives to the GitHub release.

Released binaries select the builder and runtime images published for the repository. Local source builds use the upstream Railpack images so they can run before the first Dashpack release.
