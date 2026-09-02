# Shell and Theme

`App.vue` provides a full dynamic-viewport flex shell with persistent navigation, theme control, and login/logout actions. Route views occupy the remaining `min-h-0` space.

`src/lib/theme.ts` supports `dark`, `light`, and `system`. The value persists under `radar-theme`; the system option follows `prefers-color-scheme`. `index.html` applies the matching class before Vue loads to prevent a light flash, with dark as the default.

Tailwind uses class-based dark mode and HSL design tokens modeled after shadcn components.
