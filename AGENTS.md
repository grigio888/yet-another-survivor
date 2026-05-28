# another-test

## Build

```
npm run build
```

## Key files

- `src/routes/+layout.svelte` — app layout
- `src/routes/+page.svelte` — home page
- `src/routes/layout.css` — global styles
- `svelte.config.js` — SvelteKit config
- `capacitor.config.ts` — Capacitor config (web output → build/)
- `android/app/build.gradle`, `ios/App/App.xcworkspace` — native apps

## Conventions

- SvelteKit app with Tailwind CSS
- Native mobile apps managed by Capacitor
- Web app builds to `build/` — Capacitor reads from directory, not `src/`
- Use dev server (`npm run dev`) during active development; do not run full builds unless explicitly asked — builds take extra time
