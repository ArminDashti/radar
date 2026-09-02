# Directory Tree

```text
radar-webui/
├── public/
│   ├── about-me/              # Optional portrait location
│   ├── flags/
│   │   └── probe1.svg         # Iran flag for the Irancell probe
│   └── logos/                 # Transparent company marks for host rows
├── src/
│   ├── assets/index.css       # Inter, Tailwind, theme tokens
│   ├── components/
│   │   ├── ui/button/         # Shadcn-style button component
│   │   ├── ui/card/           # Shadcn-style card component
│   │   ├── FilterBar.vue      # Grid filter and legend controls
│   │   ├── MultiSelect.vue    # Checkbox multi-select dropdown
│   │   ├── LatencyGrid.vue    # Wrapping latency squares
│   │   └── LatencySquare.vue  # Threshold-colored latency cell
│   ├── lib/
│   │   ├── api.ts             # Typed authenticated fetch client
│   │   ├── auth.ts            # Reactive JWT persistence
│   │   ├── latency.ts         # Latency colors and square sizes
│   │   ├── theme.ts           # Theme persistence and cycling
│   │   └── utils.ts           # Tailwind class merging
│   ├── router/index.ts        # Routes and auth guard
│   ├── views/                 # Route-level page components
│   ├── App.vue                # Viewport shell and navigation
│   ├── main.ts                # Vue application entry
│   └── vite-env.d.ts          # Vite client declarations
├── docs/                      # Architecture and risk documentation
├── .gitignore                 # Generated and local exclusions
├── index.html                 # HTML and anti-FOUC theme bootstrap
├── package.json               # Dependencies and scripts
├── postcss.config.js          # PostCSS plugins
├── tailwind.config.js         # Design tokens and dark mode
├── tsconfig*.json             # TypeScript project settings
└── vite.config.ts             # Vue plugin, alias, API proxy
```
