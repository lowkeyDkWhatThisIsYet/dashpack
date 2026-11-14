package deployment

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os/exec"
	"strconv"
	"strings"
	"time"
)

type Options struct {
	Name        string
	Image       string
	Port        int
	Environment []string
	HealthPath  string
	Timeout     time.Duration
}

// Docker allocates a loopback port so candidates never interrupt a running app.
func Start(ctx context.Context, options Options) (string, error) {
	if !strings.HasPrefix(options.HealthPath, "/") || strings.HasPrefix(options.HealthPath, "//") {
		return "", fmt.Errorf("health path must start with a single slash")
	}
	name := fmt.Sprintf("dashpack-%s-%d", options.Name, time.Now().UnixNano())
	args := []string{"run", "--detach", "--name", name, "--label", "com.dashpack.app=" + options.Name,
		"--restart", "unless-stopped", "--publish", fmt.Sprintf("127.0.0.1::%d", options.Port)}
	for _, value := range options.Environment {
		key, _, _ := strings.Cut(value, "=")
		if key == "PORT" {
			return "", fmt.Errorf("use --port to configure PORT")
		}
		args = append(args, "--env", value)
	}
	args = append(args, "--env", "PORT="+strconv.Itoa(options.Port), options.Image)
	if _, err := docker(ctx, args...); err != nil {
		return "", err
	}
	ready := false
	defer func() {
		if !ready {
			// Cleanup has its own deadline because startup may exhaust its context.
			cleanup, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()
			_, _ = docker(cleanup, "rm", "--force", name)
		}
	}()
	binding, err := docker(ctx, "port", name, strconv.Itoa(options.Port)+"/tcp")
	if err != nil {
		return "", err
	}
	address := "http://" + strings.TrimSpace(binding)
	if _, _, err := net.SplitHostPort(strings.TrimSpace(binding)); err != nil {
		return "", fmt.Errorf("invalid Docker port binding: %w", err)
	}
	health, cancel := context.WithTimeout(ctx, options.Timeout)
	defer cancel()
	if err := waitForHTTP(health, address+options.HealthPath); err != nil {
		return "", fmt.Errorf("deployment %s failed readiness; previous containers remain running: %w", name, err)
	}
	ready = true
	return address, nil
}

func docker(ctx context.Context, args ...string) (string, error) {
	output, err := exec.CommandContext(ctx, "docker", args...).CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("docker %s: %w: %s", args[0], err, strings.TrimSpace(string(output)))
	}
	return string(output), nil
}

func waitForHTTP(ctx context.Context, address string) error {
	// Redirects count as ready without following them to an unrelated service.
	client := &http.Client{Timeout: 2 * time.Second, CheckRedirect: func(_ *http.Request, _ []*http.Request) error {
		return http.ErrUseLastResponse
	}}
	ticker := time.NewTicker(250 * time.Millisecond)
	defer ticker.Stop()
	for {
		request, err := http.NewRequestWithContext(ctx, http.MethodGet, address, nil)
		if err != nil {
			return err
		}
		response, err := client.Do(request)
		if err == nil {
			_ = response.Body.Close()
			if response.StatusCode >= 200 && response.StatusCode < 400 {
				return nil
			}
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
		}
	}
}
