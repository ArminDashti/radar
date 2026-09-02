# Endpoints

| Method | Path | Purpose | Authentication |
|---|---|---|---|
| POST | `/api/auth/login` | Exchange credentials for JWT (`token`, `username`, `role`) | Public |
| POST | `/api/auth/signup` | Create account (role `user`) and return JWT | Public |
| GET | `/api/me/host-prefs` | Saved host visibility prefs (`host_ids`) | JWT |
| PUT | `/api/me/host-prefs` | Replace saved `host_ids` | JWT |
| GET | `/api/host-requests` | List host add requests (own for users; all for admin; optional `?status=`) | JWT |
| POST | `/api/host-requests` | Submit a host add request | JWT |
| POST | `/api/host-requests/:id/approve` | Approve request and create monitored host | JWT admin |
| POST | `/api/host-requests/:id/reject` | Reject pending request | JWT admin |
| GET | `/api/probes` | List probes (includes latest agent public_ip) | Public |
| PUT | `/api/probes/:id` | Update probe name | JWT admin |
| GET | `/api/hosts` | List hosts | JWT admin |
| POST | `/api/hosts` | Create host | JWT admin |
| PUT | `/api/hosts/:id` | Update host | JWT admin |
| DELETE | `/api/hosts/:id` | Delete host (cascades samples) | JWT admin |
| POST | `/api/hosts/:id/logo` | Upload host logo | JWT admin |
| POST | `/api/hosts/:id/test` | On-demand HTTP/ICMP test from API | JWT admin |
| GET | `/api/admin/stats` | DB ping, table counts, last sample, DB size | JWT admin |
| GET | `/api/grid/hosts` | Host latency grid (`interval`, `protocol`, `probe`, optional `window` 1–720) | Public |
| GET | `/api/grid/probes` | Probe latency grid (`interval`, `protocol`, optional `window` 1–720) | Public |
| GET | `/api/logos/:filename` | Serve uploaded logo file | Public |
| GET | `/api/agent/targets` | List active agent targets | Agent token |
| POST | `/api/agent/samples` | Upsert minute samples; skips deleted/disabled hosts (`accepted`, `skipped`) | Agent token |
