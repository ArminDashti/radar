package probe

import (
	"context"
	"net/http"
	"strings"
	"time"
)

func HTTP(ctx context.Context, host string, timeout time.Duration) (latencyMS *float64, ok bool, errMsg string) {
	client := &http.Client{Timeout: timeout}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, normalizeURL(host), nil)
	if err != nil {
		return nil, false, err.Error()
	}
	start := time.Now()
	resp, err := client.Do(req)
	if err != nil {
		return nil, false, err.Error()
	}
	latency := float64(time.Since(start).Microseconds()) / 1000
	resp.Body.Close()
	return &latency, true, ""
}

func normalizeURL(host string) string {
	host = strings.TrimSpace(host)
	if strings.HasPrefix(host, "http://") || strings.HasPrefix(host, "https://") {
		return host
	}
	return "https://" + host
}
