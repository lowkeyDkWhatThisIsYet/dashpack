package cli

import (
	"context"
	"fmt"
	"path/filepath"
	"regexp"
	"time"

	"github.com/railwayapp/railpack/buildkit"
	"github.com/railwayapp/railpack/core"
	"github.com/railwayapp/railpack/internal/deployment"
	"github.com/urfave/cli/v3"
)

var deploymentName = regexp.MustCompile(`^[a-z0-9][a-z0-9_-]{0,62}$`)

var DeployCommand = &cli.Command{
	Name:      "deploy",
	Usage:     "Build and run a local application with Docker",
	ArgsUsage: "DIRECTORY",
	Flags: append([]cli.Flag{
		&cli.StringFlag{Name: "name", Usage: "Application name (defaults to directory name)"},
		&cli.IntFlag{Name: "port", Value: 3000, Usage: "Application port inside the container"},
		&cli.StringFlag{Name: "health-path", Value: "/", Usage: "HTTP path that must return 2xx or 3xx"},
		&cli.DurationFlag{Name: "timeout", Value: 90 * time.Second, Usage: "Startup timeout"},
	}, commonPlanFlags()...),
	Action: func(ctx context.Context, cmd *cli.Command) error {
		port := cmd.Int("port")
		if port < 1 || port > 65535 || cmd.Duration("timeout") <= 0 {
			return fmt.Errorf("port must be between 1 and 65535 and timeout must be positive")
		}
		result, source, env, err := GenerateBuildResultForCommand(cmd)
		if err != nil {
			return err
		}
		name := cmd.String("name")
		if name == "" {
			name = filepath.Base(source.Source)
		}
		if !deploymentName.MatchString(name) {
			return fmt.Errorf("application name must use lowercase letters, digits, underscores or hyphens (maximum 63 characters)")
		}
		core.PrettyPrintBuildResult(result, core.PrintOptions{Version: Version})
		if !result.Success {
			return fmt.Errorf("application could not be built")
		}
		if err := validateSecrets(result.Plan, env); err != nil {
			return err
		}
		// Unique images let existing deployments continue serving during a build.
		image := fmt.Sprintf("dashpack/%s:%d", name, time.Now().UnixNano())
		if err := buildkit.BuildWithBuildkitClient(source.Source, result.Plan, buildkit.BuildWithBuildkitClientOptions{
			ImageName: image, ProgressMode: "auto", Secrets: env.Variables, SecretsHash: getSecretsHash(env),
		}); err != nil {
			return fmt.Errorf("build deployment: %w", err)
		}
		address, err := deployment.Start(ctx, deployment.Options{
			Name: name, Image: image, Port: int(port), Environment: cmd.StringSlice("env"),
			HealthPath: cmd.String("health-path"), Timeout: cmd.Duration("timeout"),
		})
		if err != nil {
			return err
		}
		_, err = fmt.Fprintf(cmd.Root().Writer, "Application ready: %s\n", address)
		return err
	},
}
