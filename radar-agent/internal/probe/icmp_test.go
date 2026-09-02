package probe

import (
	"context"
	"os/exec"
	"testing"
	"time"
)

func TestParsePingLatency(t *testing.T) {
	cases := []struct {
		name    string
		output  string
		wantMS  float64
		wantOK  bool
	}{
		{
			name:   "linux decimal",
			output: "64 bytes from 1.1.1.1: icmp_seq=1 ttl=57 time=12.3 ms",
			wantMS: 12.3,
			wantOK: true,
		},
		{
			name:   "linux no space before ms",
			output: "64 bytes from 1.1.1.1: icmp_seq=1 ttl=57 time=12ms",
			wantMS: 12,
			wantOK: true,
		},
		{
			name:   "linux comma decimal",
			output: "64 bytes from 1.1.1.1: icmp_seq=1 ttl=57 time=12,5 ms",
			wantMS: 12.5,
			wantOK: true,
		},
		{
			name:   "windows equals",
			output: "Reply from 1.1.1.1: bytes=32 time=42ms TTL=57",
			wantMS: 42,
			wantOK: true,
		},
		{
			name:   "windows under one ms",
			output: "Reply from 127.0.0.1: bytes=32 time<1ms TTL=128",
			wantMS: 1,
			wantOK: true,
		},
		{
			name:   "windows spaced equals",
			output: "Reply from 8.8.8.8: bytes=32 time=15.0 ms TTL=117",
			wantMS: 15,
			wantOK: true,
		},
		{
			name:   "no time line",
			output: "Request timed out.",
			wantOK: false,
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, ok := parsePingLatency(tc.output)
			if ok != tc.wantOK {
				t.Fatalf("ok = %v, want %v", ok, tc.wantOK)
			}
			if !tc.wantOK {
				return
			}
			if got == nil || *got != tc.wantMS {
				t.Fatalf("latency = %v, want %v", got, tc.wantMS)
			}
		})
	}
}

func TestICMPLocalhost(t *testing.T) {
	if _, err := exec.LookPath("ping"); err != nil {
		t.Skip("ping not in PATH")
	}
	latency, ok := ICMP(context.Background(), "127.0.0.1", 3*time.Second)
	if !ok || latency == nil || *latency < 0 {
		t.Fatalf("latency = %v, ok = %v", latency, ok)
	}
}
