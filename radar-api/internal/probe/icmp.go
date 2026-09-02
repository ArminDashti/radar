package probe

import (
	"context"
	"net/url"
	"os/exec"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"time"
)

// Matches Windows/Linux ping time lines, e.g. time=12.3 ms, time=12ms, time<1ms.
var pingTimePattern = regexp.MustCompile(`(?i)time[=<]\s*([0-9]+(?:[.,][0-9]+)?)\s*ms`)

func ICMP(ctx context.Context, host string, timeout time.Duration) (latencyMS *float64, ok bool, errMsg string) {
	hostname := probeHostname(host)
	if hostname == "" {
		return nil, false, "invalid host"
	}
	if latency, ok := commandPing(ctx, hostname, timeout); ok {
		return latency, true, ""
	}
	return nil, false, "timeout"
}

func commandPing(ctx context.Context, host string, timeout time.Duration) (*float64, bool) {
	pingCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()
	var args []string
	if runtime.GOOS == "windows" {
		args = []string{"-n", "1", "-w", strconv.Itoa(int(timeout.Milliseconds())), host}
	} else {
		seconds := int(timeout.Seconds())
		if seconds < 1 {
			seconds = 1
		}
		args = []string{"-c", "1", "-W", strconv.Itoa(seconds), host}
	}
	output, err := exec.CommandContext(pingCtx, "ping", args...).CombinedOutput()
	if err != nil {
		return nil, false
	}
	return parsePingLatency(string(output))
}

func parsePingLatency(output string) (*float64, bool) {
	match := pingTimePattern.FindStringSubmatch(output)
	if len(match) != 2 {
		return nil, false
	}
	value, err := strconv.ParseFloat(strings.ReplaceAll(match[1], ",", "."), 64)
	if err != nil {
		return nil, false
	}
	return &value, true
}

func probeHostname(host string) string {
	value := strings.TrimSpace(host)
	if !strings.Contains(value, "://") {
		value = "//" + value
	}
	parsed, err := url.Parse(value)
	if err != nil {
		return ""
	}
	hostname := parsed.Hostname()
	if hostname == "" {
		return strings.Trim(value, "[]")
	}
	return hostname
}
