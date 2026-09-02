# Radar WebUI

A full-viewport Vue 3 dashboard for viewing host and probe latency, managing monitored hosts, and presenting project authorship information.

## Run locally

Requirements: Node.js 20+ and `radar-api` listening on `http://127.0.0.1:8088`.

```powershell
npm install
npm run dev
```

Vite proxies `/api` to the local API. Sign in with the seeded account (`armin` / `dopadopa123`). The JWT is stored as `radar-token` in local storage.

## Routes

- `/` redirects to `/hosts`.
- `/hosts` shows the filterable host latency grid (authenticated).
- `/endpoints` redirects to `/hosts`.
- `/probes` shows the filterable probe latency grid (authenticated).
- `/admin` redirects to `/admin/hosts` (authenticated): manage hosts (edit, test, delete) and probes; shows DB stats.
- `/about-me` is the public About Me page.
- `/login` authenticates with the Radar API.

The grid pages refresh every 30 seconds. Theme preference cycles through dark, light, and system and is stored as `radar-theme`.

## Production build

```powershell
npm run build
npm run preview
```
