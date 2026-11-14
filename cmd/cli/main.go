package main

import (
	"context"
	"os"

	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/log"
	"github.com/muesli/termenv"
	"github.com/railwayapp/railpack/cli"
	"github.com/railwayapp/railpack/core/generate"
	"github.com/railwayapp/railpack/core/plan"
	urfave "github.com/urfave/cli/v3"
)

var (
	verbose      bool
	version      = "dev"
	builderImage string
	runtimeImage string
)

func main() {
	cli.Version = version
	if builderImage != "" {
		generate.RailpackBuilderImage = builderImage
	}
	if runtimeImage != "" {
		plan.RailpackRuntimeImage = runtimeImage
	}

	logger := log.Default()
	logger.SetTimeFormat("")
	urfaveLogWriter := logger.StandardLog(log.StandardLogOptions{
		ForceLevel: log.ErrorLevel,
	}).Writer()
	urfave.ErrWriter = urfaveLogWriter

	if os.Getenv("FORCE_COLOR") != "" {
		lipgloss.SetColorProfile(termenv.TrueColor)
	}

	// https://no-color.org
	if os.Getenv("NO_COLOR") != "" {
		lipgloss.SetColorProfile(termenv.Ascii)
	}

	commands := []*urfave.Command{
		cli.BuildCommand,
		cli.DeployCommand,
		cli.PrepareCommand,
		cli.InfoCommand,
		cli.PlanCommand,
		cli.SchemaCommand,
		cli.FrontendCommand,
	}

	// Disable the slice flag separator for all commands
	for _, command := range commands {
		command.DisableSliceFlagSeparator = true
	}

	cmd := &urfave.Command{
		Name:                  "dashpack",
		Usage:                 "Automatically analyze and generate build plans for applications",
		EnableShellCompletion: true,
		ConfigureShellCompletionCommand: func(c *urfave.Command) {
			c.Hidden = false
		},
		Version: cli.Version,
		Flags: []urfave.Flag{
			&urfave.BoolFlag{
				Name:        "verbose",
				Usage:       "Enable verbose logging",
				Sources:     urfave.EnvVars("DASHPACK_VERBOSE", "RAILPACK_VERBOSE"),
				Value:       false,
				Destination: &verbose,
			},
		},
		Before: func(ctx context.Context, cmd *urfave.Command) (context.Context, error) {
			configureLogging(verbose)

			return ctx, nil
		},
		Commands: commands,
	}

	if err := cmd.Run(context.Background(), os.Args); err != nil {
		log.Fatal(err)
	}
}

func configureLogging(verbose bool) {
	log.SetTimeFormat("")

	if verbose {
		log.SetLevel(log.DebugLevel)
	} else {
		log.SetLevel(log.InfoLevel)
	}
}
