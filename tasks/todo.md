# todo.md — Miranon Media Admin (React)
*Senast uppdaterad: 2026-04-13 (Tailwind v4 @theme-migration)*

> Aktiva uppgifter. Lärdomar fångas i `tasks/lessons.md`.
> Styrande dokument: `~/Repon/miranon-media-os/docs/react-migration/conversion-plan.md`

---

## Fas 0: Projektsetup + tokens

**Mål:** Fungerande React-projekt med alla verktyg installerade, tokens konfigurerade, lint som passerar.

**Beroenden:** Inga.
**Uppskattad tid:** 1 session.

### Initiering

- [ ] 0. Initiera Vite-projekt: `npm create vite@latest . -- --template react-ts && npm install`

### Filer som skapas

- [ ] `package.json` (alla dependencies)
- [ ] `vite.config.ts` (React-plugin + `@tailwindcss/vite` + [GA] security headers-plugin med CSP-nonce)
- [ ] `tsconfig.json`
- [ ] `tsconfig.app.json`
- [ ] `tsconfig.node.json`
- [ ] [GA] `biome.json` (ersätter `.eslintrc.cjs` + `.stylelintrc.cjs` — Biome 2.0 med Tailwind-plugin)
- [ ] `index.html`
- [ ] `src/main.tsx` (minimal — renderar "Hello" + [GA] registrerar service worker)
- [ ] `src/styles/tokens/primitives.css` (från DESIGN-SYSTEM-SPEC §1)
- [ ] `src/styles/tokens/semantic.css` (från DESIGN-SYSTEM-SPEC §1)
- [ ] `src/styles/tokens/components.css` (skelett)
- [ ] `src/styles/base.css` (reset, fokusregel, typografi)
- [ ] `src/styles/tailwind.css` (`@import "tailwindcss"` + `@theme`-block från DESIGN-SYSTEM-SPEC §8 — ersätter `tailwind.config.ts`)
- [ ] `src/lib/cn.ts` (clsx + tailwind-merge)
- [ ] [GA] `src/lib/report-web-vitals.ts` (web-vitals → Sentry/sendBeacon)
- [ ] [GA] `src/env.ts` (@t3-oss/env-core — validerar VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY vid uppstart)
- [ ] `playwright.config.ts` (från DESIGN-SYSTEM-SPEC §6)
- [ ] `.env.local` (Supabase URL + anon key — skapa lokalt, INTE `git add`. Verifiera att den matchas av `.env*` i `.gitignore`)
- [ ] [GA] `public/sw.js` (tom service worker-skelett — registreras i main.tsx, utökas med Workbox i Fas 5)

### Verifiering

- [ ] 1. `npm run dev` startar utan fel (bekräftar `@tailwindcss/vite` fungerar utan postcss)
- [ ] 2. `npm run build` producerar output utan varningar
- [ ] 3. `npx tsc --noEmit` — noll TypeScript-fel
- [ ] 4. [GA] `npx @biomejs/biome check .` — noll fel (ersätter ESLint)
- [ ] 5. Token-CSS laddas: inspektera `:root` i DevTools, verifiera att `--mm-primary` resolvar till `#D4960A`. Tailwind exponerar även `@theme`-vars som `--color-primary` etc.
- [ ] 6. Tailwind genererar utilities från `@theme`: `text-primary`, `bg-surface`, `text-text-secondary`, `text-caption`, `text-body` (1rem/line-height 1.5), `font-sans` (Inter) fungerar
- [ ] 7. [GA] Service worker registrerad: `navigator.serviceWorker.controller` !== null i DevTools
- [ ] 8. [GA] web-vitals hook importerbar utan fel
- [ ] 9. [GA] Saknad env-variabel → uppstartsfel (testa genom att ta bort VITE_SUPABASE_URL)
- [ ] 10. [GA] `npm audit --audit-level=high` — 0 high/critical

### Risker

- Tailwind v4 `@theme` (CSS-first) — verifiera att alla utility-klasser genereras korrekt vid dev-start. Se ändringsspec 2026-04-13 (migrering från `tailwind.config.ts`).
- [GA] Biome 2.0 Tailwind-plugin: verifiera att `classnames-order` och `no-arbitrary-value` fungerar.

---

## Nästa fas

**Fas 1: Domäntransplant** — kopiera 13 domänfiler från Vue-repot via `FILE-INVENTORY.md`-scriptet, lägg på Zod-scheman, verifiera mot Airtable MCP. Kräver Fas 0 klar.
