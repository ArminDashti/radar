# Description

Radar WebUI is a Vue 3 monitoring dashboard that visualizes rolled-up HTTP and ICMP latency by host and probe, provides host administration, and includes a public About Me page. It uses Vite, TypeScript, Vue Router, Tailwind CSS, Inter, Lucide icons, and shadcn-style local UI components. Run it with `npm run dev`; Vite proxies `/api` requests to `http://127.0.0.1:8088`.

Authentication uses a JWT stored in local storage under `radar-token`. Theme selection supports dark, light, and system modes under `radar-theme`, defaulting to dark.
