# Agent modules

- `config`: loads optional `.env`, defaults, required token, and timeouts.
- `hub`: exchanges typed targets and sample batches using Bearer authentication.
- `probe`: measures HTTP responses and ICMP latency via OS `ping` (one echo).
- `loop`: schedules one randomized run per clock minute, probes concurrently,
  and retries hub failures with capped exponential backoff.
- `cmd/radar-agent`: wires configuration, cancellation signals, client, and loop.

Failed probes must have `latency_ms=null`. Submitted `observed_at` values are UTC
and truncated to a minute.
