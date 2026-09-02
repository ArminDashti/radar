package loop

import (
	"context"
	"math/rand"
	"testing"
	"time"

	"github.com/ArminDashti/radar-agent/internal/hub"
)

func TestNextProbeTimeUsesCurrentOrNextMinute(t *testing.T) {
	rng := rand.New(rand.NewSource(1))
	now := time.Date(2026, 8, 13, 12, 0, 0, 0, time.UTC)
	next := nextProbeTime(now, rng)
	if next.Second() < 5 || next.Second() > 50 || !next.After(now) {
		t.Fatalf("next = %v", next)
	}

	late := time.Date(2026, 8, 13, 12, 0, 55, 0, time.UTC)
	next = nextProbeTime(late, rng)
	if next.Minute() != 1 || next.Second() < 5 || next.Second() > 50 {
		t.Fatalf("next after late time = %v", next)
	}
}

func TestBackoffCapsAtThirtySeconds(t *testing.T) {
	if got := retryDelay(10); got != 30*time.Second {
		t.Fatalf("retryDelay(10) = %v", got)
	}
	if got := retryDelay(0); got != time.Second {
		t.Fatalf("retryDelay(0) = %v", got)
	}
}

func TestRetryStopsOnPermanentError(t *testing.T) {
	ctx := context.Background()
	calls := 0
	err := retry(ctx, "submit samples", func() error {
		calls++
		return &hub.PermanentError{StatusCode: 400, Body: `{"error":"gone"}`}
	})
	if !hub.IsPermanent(err) {
		t.Fatalf("err = %v", err)
	}
	if calls != 1 {
		t.Fatalf("calls = %d, want 1 (no retry)", calls)
	}
}
