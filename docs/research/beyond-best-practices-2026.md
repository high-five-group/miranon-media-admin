# Beyond Best Practices — Moderna Webbapplikationer (2026)

> **Djupgående forskningsrapport** | Sammanställd 2026-04-06
> 8 forskningsområden | 400+ källor | Konkreta kodexempel och arkitekturmönster
>
> **Syfte:** Avancerade mönster och tekniker som går bortom standardrekommendationer
> för att bygga moderna webbapplikationer i världsklass.

---

## Innehållsförteckning

1. [Arkitektur](#1-arkitektur)
2. [Performance](#2-performance)
3. [State Management](#3-state-management)
4. [DX & Tooling](#4-dx--tooling)
5. [Resilience & Observability](#5-resilience--observability)
6. [Säkerhet](#6-säkerhet)
7. [Tillgänglighet](#7-tillgänglighet)
8. [Domänspecifikt: LMS/CMS för Event, Utbildning & Coaching](#8-domänspecifikt-lmscms)
9. [Tvärgående teman & Rekommendationer](#9-tvärgående-teman)

---

## 1. Arkitektur

> **Detaljrapport:** `webapp-arkitektur-beyond-best-practices.md`

### 1.1 Edge-First Architecture

**Kärnan:** Applikationens primära exekveringsmiljö är edge-noder (CDN-servrar nära användaren) istället för en central server. V8 isolates startar på <1ms mot 200-500ms för Lambda.

**Resultat:** 60-80% reduktion i TTFB (Time to First Byte).

**De tre plattformarna:**

| Plattform | Arkitektur | Styrka | Begränsning |
|-----------|-----------|--------|-------------|
| **Cloudflare Workers** | V8 isolates, 300+ DC | Bredast ekosystem (D1, KV, R2, Durable Objects) | 128MB minne, ej full Node.js |
| **Vercel Edge Functions** | V8 isolates (Cloudflare-baserat) | Sömlös Next.js-integration, Fluid Compute (2025) | Vercel-bundet |
| **Deno Deploy** | V8 isolates, TypeScript-first | Fresh-ramverket, inbyggd KV | Mindre ekosystem |

**Edge-nativa databaser:**

| Databas | Typ | Strategi | Läslatens |
|---------|-----|----------|-----------|
| **Turso** | libSQL (SQLite-fork) | Embedded replicas på edge | <1ms |
| **Cloudflare D1** | SQLite | Co-located med Worker | <1ms |
| **Neon** | PostgreSQL (serverless) | HTTP-baserad driver | 5-15ms |

**Drizzle ORM** är den dominerande edge-kompatibla ORM:en — stödjer alla edge-databaser.

```typescript
// Drizzle med Turso (edge-nativ)
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
const client = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });
const db = drizzle(client);
```

**Datareplikeringsmönster:**
- Läsningar: Lokala replikor på edge (<1ms)
- Skrivningar: Routas till primary (50-200ms, acceptabelt)
- Eventual consistency: Replikor synkas inom 50-200ms

**Trade-offs:** Sub-50ms TTFB globalt, eliminerar cold starts | Begränsad CPU/minne, eventual consistency, debugging svårare.

---

### 1.2 Islands Architecture

**Kärnan:** Sidan delas i isolerade "öar" av interaktivitet omgivna av statisk HTML. Bara interaktiva komponenter får JavaScript — resten skickar noll JS.

```
Traditionell: Total JS ~250KB (hela sidan hydratiseras)
Islands:      Total JS ~15KB  (bara knappar och sökwidgets)
```

**Astro** — ledande ramverket (ramverksagnostiskt: React + Vue + Svelte på samma sida):

| Direktiv | När JS laddas | Användning |
|----------|---------------|------------|
| `client:load` | Direkt | Kritiska interaktiva element |
| `client:idle` | requestIdleCallback | Icke-kritisk interaktivitet |
| `client:visible` | IntersectionObserver | Innehåll under viken |
| `client:media="query"` | CSS media query matchar | Mobilspecifika komponenter |
| (inget) | Aldrig — noll JS | Statiskt innehåll |

**Server Islands (Astro 5):** Nästa evolution — istället för att hydratisera på klienten renderas ön on-demand på servern. 20% snabbare LCP än Next.js PPR i benchmarks.

```astro
<!-- Server Island: renderas on-demand, visar skeleton medan servern hämtar data -->
<UserProfile server:defer>
  <div slot="fallback" class="skeleton-loader" />
</UserProfile>
```

**Trade-offs:** 90%+ JS-reduktion, perfekt för content-tunga sajter | Öar kan inte dela state naturligt, ej optimalt för dashboard-appar.

---

### 1.3 Resumability (Qwik-stil)

**Kärnan:** Eliminerar hydration helt. Serialiserar applikationens tillstånd direkt i HTML. Klienten återtar där servern slutade — utan att köra JavaScript vid sidladdning.

```
Hydration:     Server renderar → Klient laddar ALL JS → Parsear → Kör → Matchar DOM → TTI: 2-10s
Resumability:  Server renderar + serialiserar state → Klient laddar HTML → KLAR! → TTI: ~0ms
```

**Hur det fungerar:**
1. Qwik serialiserar listeners, component tree och state i HTML:en
2. En minimal qwikloader (~800 bytes) installerar en global event listener
3. Vid klick: QRL (Qwik Resumable Language) URL pekar på exakt vilken chunk som ska laddas
4. Bara den klickade event-handlern laddas — inget annat

```html
<!-- Serialiserat i HTML -->
<button q:id="1" on:click="./chunk-abc.js#Counter_onClick[0]">
  Antal: <span q:id="2">0</span>
</button>
<script type="qwik/json">{"ctx":{"1":{"count":0}}}</script>
```

**Jämförelse med React:**

| Metrik | Next.js (RSC) | Qwik | Förändring |
|--------|--------------|------|------------|
| Initial JS-payload | 80-150 KB | <1 KB | -99% |
| TTI | 1.2-3.5s | 0.5-0.8s | -70% |

**Trade-offs:** Noll JS vid laddning, O(1) skalning | Brant inlärningskurva, litet ekosystem, $-konventionen förvirrande.

---

### 1.4 Server Components + Partial Prerendering (PPR)

**Kärnan:** React Server Components (RSC) renderar EXKLUSIVT på servern — skickar noll JavaScript till klienten. PPR blandar statisk och dynamisk rendering i EN response.

```tsx
// SERVER COMPONENT — koden existerar ALDRIG på klienten
import { db } from '@/lib/database';  // Direkt databasåtkomst!
import shiki from 'shiki';            // 500KB — GRATIS för klienten (0KB)

export default async function ProductPage({ params }) {
  const product = await db.query('SELECT * FROM products WHERE slug = $1', [params.slug]);
  return (
    <article>
      <h1>{product.name}</h1>
      {/* BARA denna komponent skickar JS till klienten */}
      <AddToCartButton productId={product.id} />
    </article>
  );
}
```

**PPR (Next.js 15/16):** Statisk shell cachas på CDN, dynamiska delar streamar in via Suspense-boundaries.

**Server Actions** — `'use server'` funktioner som körs på servern, anropas från klienten:

```tsx
'use server';
export async function addToCart(productId: string) {
  await db.query('INSERT INTO cart_items ...', [session.userId, productId]);
  revalidatePath('/cart');
}
```

**Trade-offs:** Drastisk bundle-reduktion, tunga beroenden utan klientkostnad | Ny mental modell, `"use client"` smittar nedåt.

---

### 1.5 Composable Architecture (Micro-Frontends 2.0)

**Module Federation 2.0:** Komplett omskrivning med Rspack + Vite-stöd, plugin-baserad runtime, automatisk typ-generering, och Federation DevTools.

**Web Components som integrationslager** mellan team med olika ramverk.

**Trade-offs:** Team-autonomi, oberoende deploys | Komplexitet, delade beroenden, debugging svårare.

---

## 2. Performance

> **Detaljrapport:** `web-performance-beyond-best-practices.md`

### 2.1 Streaming SSR

**Kärnan:** `renderToPipeableStream` (React 18+) skickar HTML progressivt medan servern renderar. Browsern visar header efter 200ms istället för att vänta 3s på hela sidan.

**Out-of-order streaming:** React streamar i den ordning data *blir tillgänglig*, inte i DOM-ordning. Om kommentarer laddas snabbare än produkter — streamas kommentarerna först.

**Selektiv hydration:** React prioriterar hydration av komponenter användaren interagerar med.

```jsx
<Suspense fallback={<HeroSkeleton />}>
  <HeroSection />        {/* Streamas tidigt */}
</Suspense>
<Suspense fallback={<ProductSkeleton />}>
  <ProductList />         {/* Streamas när data finns */}
</Suspense>
<Suspense fallback={<CommentsSkeleton />}>
  <Comments />            {/* Lägst prioritet */}
</Suspense>
```

---

### 2.2 Speculation Rules API

**Kärnan:** Intelligent prefetching baserat på URL-mönster och användarinteraktion. Google Search använder det — sparar ~67ms per navigering.

```html
<script type="speculationrules">
{
  "prerender": [{
    "where": {
      "and": [
        { "href_matches": "/*" },
        { "not": { "href_matches": "/logout" } },
        { "not": { "selector_matches": ".no-prerender" } }
      ]
    },
    "eagerness": "moderate"
  }]
}
</script>
```

| Eagerness | Trigger | Bäst för |
|-----------|---------|----------|
| `immediate` | Direkt | Högst sannolika navigeringar |
| `moderate` | Hover i 200ms | Balanserat — standard |
| `conservative` | Mousedown/touchstart | Bandbreddskänsliga |

**Prefetch vs. Prerender:**
- Prefetch: Laddar bara HTML (låg kostnad, stödjer cross-site)
- Prerender: Renderar ALLT i osynlig flik (nästintill instant navigering, högre kostnad)

**Serverside-detektion:** `Sec-Purpose: prefetch` header → skippa analytics/sidoeffekter.

---

### 2.3 View Transitions API

**Kärnan:** Nativa, GPU-accelererade övergångar mellan sidor — även i MPA — med enbart CSS.

**Cross-document transitions (MPA — revolutionen):**
```css
@view-transition { navigation: auto; }
.product-card-42  { view-transition-name: product-42; }  /* Sida 1 */
.product-hero     { view-transition-name: product-42; }  /* Sida 2 */
/* Browsern animerar automatiskt mellan elementen! */
```

**SPA-transitions:**
```javascript
document.startViewTransition(async () => {
  const data = await fetchNewPage('/about');
  document.querySelector('main').innerHTML = data;
});
```

**Framework-integration:** Next.js 15+ (`experimental: { viewTransition: true }`), Astro (`<ClientRouter />`).

---

### 2.4 INP-optimering (Interaction to Next Paint)

**Kärnan:** INP mäter ALLA interaktioner, inte bara den första (FID). Det 98:e percentilvärdet avgör. Bra: <200ms.

**Tre faser:** Input delay → Processing time → Presentation delay.

**Nyckeltekniker:**

1. **Long Animation Frames API (LoAF):** Säger *exakt vilken funktion*, i vilken fil, på vilken rad som orsakade problemet (Long Tasks säger bara "något tog lång tid").

2. **`scheduler.yield()`** — Yield till main thread utan att tappa prioritet:
```javascript
for (const item of items) {
  processItem(item);
  if (shouldYield()) await scheduler.yield();
  // Main thread fri — browsern hanterar klick/scroll
}
```

3. **`scheduler.postTask()`** — Prioriterad uppgiftshantering:
```javascript
await scheduler.postTask(() => showSpinner(), { priority: 'user-blocking' });
await scheduler.postTask(() => updateUI(data), { priority: 'user-visible' });
scheduler.postTask(() => analytics.track(), { priority: 'background' });
```

4. **`content-visibility: auto`** — Browsern skippar rendering av element utanför viewport.

5. **Web Workers** — Flytta tungt arbete från main thread.

---

### 2.5 Bundle-less Development

**Vites approach:** ESM i development (noll bundling), Rolldown i produktion.

**Import Maps:** Browser-nativ modulupplösning utan bundler:
```html
<script type="importmap">
{ "imports": { "react": "https://esm.sh/react@19" } }
</script>
```

### 2.6 Avancerad Bildoptimering

- **AVIF:** 50% bättre kompression än JPEG
- **`fetchpriority="high"`** på hero-bilder
- **BlurHash/ThumbHash** för omedelbara placeholders
- **Intersection Observer** för precis lazy loading-kontroll

---

## 3. State Management

> **Detaljrapport:** `state-management-beyond-best-practices.md`

### 3.1 Signals — Reaktivitetsrevolutionen

**Kärnan:** Reaktiva primitiver som uppdaterar ENBART de specifika DOM-delarna som beror på det ändrade värdet — utan virtual DOM-diffing.

**Varför signals > useState:**
1. State lever utanför komponenten → kirurgiskt precisa uppdateringar
2. Inga stale closures (signals är pekare, inte closurefångade värden)
3. Memoisering inbyggd — computed körs bara när beroenden ändras
4. Ingen virtual DOM behövs

**TC39 Signals Proposal (Stage 1):**
```javascript
const counter = new Signal.State(0);
const isPositive = new Signal.Computed(() => counter.get() > 0);
// Push-pull hybrid: push "dirty"-markering, pull beräkning (lazy)
```

**Signals i ramverken:**

| Ramverk | Syntax | Unikt |
|---------|--------|-------|
| Preact | `signal(0)`, `.value` | Fungerar utan ramverk |
| Angular (v17+) | `signal(0)`, `count()` | `linkedSignal` (tvåvägs-derivat), `resource` (async signal) |
| Vue 3 | `ref(0)`, `.value` | Proxy-baserad, djupt reaktivt |
| Solid | `createSignal(0)`, getter/setter | Kompilerar till direkt DOM |
| Svelte 5 | `$state(0)`, `$derived()` | Kompilator-hint, inte runtime |

---

### 3.2 Fine-grained Reactivity

**SolidJS:** Komponenter körs EN gång — det React kallar "re-render" existerar inte. Kompilatorn genererar direkta DOM-operationer.

**Svelte 5 Runes:**
```svelte
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);
  $effect(() => { console.log(count); }); // Auto-tracking, inget dep-array!
</script>
```

**Jämförelse:**
- React: Hela komponentträdet re-renderas → virtual DOM diff → bara ändrade noder uppdateras
- Solid/Svelte: Signal → direkt till DOM-nod. Ingen traversering, inget diffing.

---

### 3.3 Server-driven State

**Paradigmskiftet:** Majoriteten av state är serverstate som temporärt visas på klienten. Behandla det som serverstate (TanStack Query) — inte klientstate (Redux).

**TanStack Query-mönster:** Stale-while-revalidate, optimistiska mutationer med rollback, automatisk cache/retry/dedup.

**RSC-principen:**
- Serverstate = server-komponenter (direkt databasåtkomst)
- Klientstate = client-komponenter (modaler, formulär, animationer)
- Delat state = Server Actions + TanStack Query

---

### 3.4 CRDT & Optimistisk UI

**CRDT (Conflict-free Replicated Data Types):** Datastrukturer som *matematiskt garanterar* att alla kopior konvergerar — oavsett ordning. Ingen central server behövs.

**Yjs** (13KB, optimerat för text) vs **Automerge** (800KB WASM, starkare akademiskt stöd).

**Local-first arkitektur:** Klienten har egen CRDT + IndexedDB. WebSocket synkar vid behov. Fungerar offline. Omedelbar respons.

---

### 3.5 State Machines (XState v5)

**Kärnan:** Gör omöjliga tillstånd omöjliga. Istället för `isLoading && error && data` (som inte borde existera) — en state machine kan bara vara i ETT tillstånd åt gången.

**Statecharts:** Hierarkiska + parallella tillstånd. Actor Model för distribuerad state.

**Använd för:** Komplexa UI-flöden (wizard, checkout), asynkrona processer, mediaspelning.
**Använd inte för:** Enkla formulärvärden, server-data-caching, globalt tema.

---

### 3.6 URL som State (nuqs)

Type-safe URL-state med parsers:
```typescript
const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''));
const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
// URL: ?q=hej&page=2 — delbar, bokmärkbar, back-knappen fungerar
```

---

## 4. DX & Tooling

> **Detaljrapport:** `modern-dx-beyond-best-practices.md`

### 4.1 Monorepo-strategier

| Verktyg | Styrka | Skala |
|---------|--------|-------|
| **Turborepo** | Enkel, snabb | 5-50 paket |
| **Nx** | Kraftfull, distribuerad exekvering, project graph | 50-1000+ paket |
| **pnpm workspaces** | Grundlager, strikt dep-isolation | Under Turbo/Nx |

**10 beprövade mönster:** Content-hash caching, topologisk pipeline, affected-only CI, remote cache, workspace protocol, isolerade configs, pruned deploys, boundary enforcement, Changesets, dynamic matrix CI.

---

### 4.2 Type-safe Fullstack

**Kedjan:** Drizzle Schema → drizzle-zod → Zod Schemas → tRPC/Server Actions → Frontend (full IntelliSense).

```typescript
// Drizzle: Databasens DDL + Zod + TypeScript-typer definieras EN gång
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
});
export const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email.email("Ogiltig e-post"),
});
export type User = typeof users.$inferSelect;
```

**tRPC vs Server Actions:**
- tRPC: API konsumeras av flera klienter, subscriptions, komplex cache
- Server Actions: Enkla formulär, enkel revalidering, inbyggt i React 19

**t3-env:** Type-safe miljövariabler — appen kraschar vid uppstart om en variabel saknas.

---

### 4.3 AI-assisterad Utveckling

**Paradigmskifte:** Från "AI som autocomplete" (2022) till "AI som arkitekt" (2025-2026). 30-60% produktivitetsökning — men bara med rätt **context engineering**.

| Verktyg | Styrka | Bäst för |
|---------|--------|----------|
| **Claude Code** | Autonomt agentarbete, subagenter, hooks, skills | Arkitektur, multi-fil, code review |
| **Cursor** | IDE-integrerat, inline-diffs | Daglig kodning, snabb iteration |
| **GitHub Copilot** | Bäst autocomplete, billigast | Enkel autocomplete, boilerplate |

**Context engineering** — den nya kärnkompetensen:
- CLAUDE.md som projektkonstitution (hierarkisk: global → projekt → paket)
- Lessons learned som levande dokument
- PIV-mönstret: Plan → Implement → Verify
- Hooks som automatiserad CI-pipeline

---

### 4.4 Feature Flags som Arkitektur

**Trunk-based development:** Alla committar till `main` varje dag. Ofärdig kod skyddas av feature flags istället för branches.

**Expand/Contract-mönster** för databasmigrationer utan driftstopp:
1. EXPAND: Lägg till nya kolumner, dual-write
2. MIGRATE: Backfill data
3. SWITCH: Byt läsning via flag
4. CONTRACT: Ta bort gamla kolumner och flaggan

| Plattform | Open source | Styrka |
|-----------|-------------|--------|
| **LaunchDarkly** | Nej | Mest feature-rik |
| **Unleash** | Ja (MIT) | Full kontroll |
| **PostHog** | Ja | Allt-i-ett (analytics + flags) |

---

### 4.5 Modern Build-tooling (Rust-eran)

**Varför Rust?** JavaScript-verktyg har nått prestandataket. Rust ger 10-100x speedup.

| Verktyg | Typ | Speedup vs. föregångare |
|---------|-----|------------------------|
| **Rspack** | Webpack-ersättare | 14-24x (Mercedes-Benz.io benchmark) |
| **Turbopack** | Next.js bundler | Konstant HMR oavsett app-storlek |
| **SWC** | Babel-ersättare | 25x |
| **Biome** | ESLint + Prettier | 42-65x |
| **Oxlint** | ESLint-alternativ | 50-100x |

**Migrationsstrategi:** Babel→SWC → ESLint+Prettier→Biome → Webpack→Rspack/Turbopack.

---

## 5. Resilience & Observability

> **Detaljrapport:** `frontend-resilience-observability-2025.md`

### 5.1 Graceful Degradation

**Progressiv förbättring:** Bygg från botten (fungerar utan JS) → förstärk stegvis.

**Service Worker-strategier:**

| Strategi | Använd för | Offline-beteende |
|----------|-----------|------------------|
| Cache First | Bilder, typsnitt | Fungerar fullt |
| Network First | API-data, artiklar | Visar cachad version |
| Stale-While-Revalidate | JS/CSS-bundles | Snabb + uppdaterar i bakgrunden |
| Network Only + Background Sync | POST/PUT/DELETE | Köar och synkar när online |

**Nestade Error Boundaries:** App-nivå (sista utvåg), sektion-nivå (degradera sektionen), widget-nivå (tyst degradering).

---

### 5.2 Edge Error Boundaries

- **Fallback-sidor från edge:** Cloudflare Worker servar cachade sidor vid origin-fel
- **Stale-while-error:** Edge Middleware returnerar senaste cachade version vid serverfel
- **Circuit Breaker:** CLOSED → OPEN → HALF_OPEN-tillstånd för API-anrop

---

### 5.3 Real User Monitoring (RUM)

**Bortom Lighthouse:** Mät RIKTIG användarupplevelse i produktion.

```javascript
import { onCLS, onINP, onLCP } from 'web-vitals';
onCLS((metric) => sendToAnalytics(metric));
onINP((metric) => sendToAnalytics(metric));
onLCP((metric) => sendToAnalytics(metric));
```

**Custom performance marks** för affärskritiska flöden (checkout-timing, signup-funnel).

**JourneyTracker** — mät hela användarresor inklusive övergivna.

---

### 5.4 Chaos Engineering för Frontend

- **Chaos Service Worker:** Interceptar requests och injicerar fördröjningar/fel slumpmässigt
- **Playwright-baserade chaos-tester i CI:** Simulera slow network, API-failures, offline, korrupt data
- **npm-paket:** `chaos-engineering-frontend`

---

### 5.5 Observability Stack

**OpenTelemetry för browsern:** Automatisk instrumentering + manuella spans.
- W3C Trace Context-propagering (klient → server)
- Strukturerad loggning med trace-korrelering
- **Grafana Faro** — open source-alternativ till Datadog RUM

---

### 5.6 Reliability Patterns

- Retry med exponential backoff + jitter
- Request deduplication
- Idempotency keys (Stripe-mönstret)
- Offline-kö med IndexedDB + Background Sync API
- Optimistic updates med rollback (TanStack Query)

---

## 6. Säkerhet

> **Detaljrapport:** `web-security-beyond-best-practices-2025.md`

### 6.1 Content Security Policy Level 3

**Kärnan:** 94% av allowlist-baserade CSP:er kan kringgås (Googles forskning). Den enda CSP som faktiskt skyddar är **strikt nonce-baserad med `strict-dynamic`**.

```
Content-Security-Policy:
  script-src 'nonce-{RANDOM}' 'strict-dynamic';
  object-src 'none';
  base-uri 'none';
```

**Bakåtkompatibilitet inbyggd:** CSP Level 3-browsers ignorerar automatiskt `unsafe-inline`, `self`, host-baserade källor.

**React2Shell (CVE-2025-55182):** Kritisk sårbarhet i React 19 Server Actions — 644 000+ domäner exponerade. RCE före autentisering.

---

### 6.2 Trusted Types

**Kärnan:** Det enda nativa webbplattforms-API:t som eliminerar hela klassen av DOM XSS.

```javascript
// Trusted Types låser farliga sinks
element.innerHTML = userInput;  // TypeError!
element.innerHTML = sanitizerPolicy.createHTML(userInput);  // OK

// DOMPurify-integration
const sanitizerPolicy = trustedTypes.createPolicy('dompurify', {
  createHTML: (input) => DOMPurify.sanitize(input, { RETURN_TRUSTED_TYPE: true })
});
```

**Default policy** fångar ALLA strängtilldelningar till farliga sinks — perfekt för tredjepartsbibliotek.

**Webbläsarstöd:** Chrome/Edge fullt, Firefox och Safari under implementation.

---

### 6.3 OWASP 2025+ — Nya Hotvektorer

**OWASP Top 10 för LLM-applikationer (2025):**
1. Prompt injection (direkt/indirekt)
2. Sensitive information disclosure
3. Supply chain vulnerabilities
4. Excessive agency
5. System prompt leakage

**Kritiska incidenter 2025-2026:**
- React2Shell (CVE-2025-55182) — RCE via Server Actions
- Shai-Hulud npm-masken (CISA-varning, 500+ paket)
- Axios-kompromissen mars 2026

---

### 6.4 Passkeys/WebAuthn

**412% tillväxt 2025.** Eliminerar lösenord helt.

```typescript
// SimpleWebAuthn — Registration
const options = await generateRegistrationOptions({
  rpName: 'Passionslyftet',
  rpID: 'passionslyftet.se',
  userName: user.email,
  authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
});

// Conditional UI — "passkey autocomplete"
const credential = await startAuthentication(options, true);
// Browsern visar passkeys i autocomplete
```

---

### 6.5 Supply Chain Security

**7 försvarslager:**
1. Lockfiler (committade, verifierade)
2. npm audit i CI
3. Socket.dev (beteendeanalys, inte bara CVE-databas)
4. npm provenance/Sigstore
5. Overrides för transitiva sårbarheter
6. Beroendeminimerering
7. Privat register (Verdaccio, Artifactory)

---

### 6.6 Säkerhetsheaders

**Cross-Origin Isolation (Spectre-försvar):**
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```
Möjliggör `SharedArrayBuffer`, high-resolution timers, `performance.measureUserAgentSpecificMemory()`.

**Permissions-Policy:** Kontrollera API-åtkomst per origin (kamera, mikrofon, geolocation).

---

## 7. Tillgänglighet

> **Detaljrapport:** `webbtillganglighet-beyond-best-practices.md`

### 7.1 ARIA 1.3

**Nya attribut:**
- `aria-braillelabel` / `aria-brailleroledescription` — Punktskriftsstöd
- `aria-description` — Beskrivning utan separat element
- `aria-errormessage` — Felmeddelande som vokaliseras bara vid `aria-invalid="true"`
- `aria-keyshortcuts` — Exponerar tangentbordsgenvägar

**Nya roller:** `suggestion`, `comment`, `mark`, `code`, `time`, `image`.

**Första regeln om ARIA:** Använd INTE ARIA om du kan använda inbyggd HTML. `<button>` istället för `<div role="button">`.

**Vanliga misstag:**
| Misstag | Problem |
|---------|---------|
| `<div role="button">` utan tangentbord | Går inte att använda med tangentbord |
| `aria-hidden="true"` på fokuserbara element | "Ghost focus" — användare fastnar |
| Överanvändning av `aria-live="assertive"` | Avbryter användaren hela tiden |

---

### 7.2 Kognitiv Tillgänglighet

**WCAG 2.2 för neurodivergenta:**
- **2.4.11 Fokus inte dolt (AA)** — Interaktiva element döljs inte av sticky headers
- **2.5.7 Drag-rörelser (AA)** — Alternativ för drag-and-drop
- **2.5.8 Målstorlek minimum (AA)** — 24x24 CSS-pixlar minimum
- **Tidsjusterbar** — Låt användare förlänga tidsgränser (ADHD-anpassning)
- **Pausa/Stoppa** — Allt rörligt innehåll måste kunna pausas

---

### 7.3 Adaptiv Design bortom Responsivitet

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; }
}
@media (prefers-contrast: more) {
  :root { --border-width: 2px; --focus-ring: 3px solid black; }
}
@media (prefers-color-scheme: dark) { /* ... */ }
@media (prefers-reduced-transparency: reduce) { /* Nytt! */ }
@media (forced-colors: active) {
  /* Windows High Contrast — använd systemfärger */
  .button { border: 1px solid ButtonText; }
}
```

---

### 7.4 Automatiserad Testning

**Fångar bara 30-40% av problem.** Nödvändigt men inte tillräckligt.

```typescript
// Playwright + axe-core
import AxeBuilder from '@axe-core/playwright';
test('ska inte ha tillgänglighetsfel', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

**Testmatris:** VoiceOver (macOS/iOS), NVDA (Windows, gratis), JAWS (Windows, enterprise).

---

### 7.5 Juridiskt Landskap

**European Accessibility Act (EAA):** I kraft sedan 28 juni 2025. Böter upp till 100 000 EUR / 4% av omsättning. Alla digitala produkter och tjänster inom EU.

**WCAG 3.0 (Silver):** Working Draft. Q4 2027 för Candidate Recommendation. Bronze/Silver/Gold-modell. **Rekommendation:** Följ WCAG 2.2 AA nu.

---

## 8. Domänspecifikt: LMS/CMS för Event, Utbildning & Coaching

> **Detaljrapport:** `lms-cms-plattform-avancerade-monster.md`

### 8.1 CMS & Innehåll

#### Headless CMS → Composable Content

**MACH-principer:** Microservices, API-first, Cloud-native, Headless.

**Payload CMS** (rekommendation):
- Next.js-nativt — lever i samma kodbas
- Local API: Querya innehåll direkt i Server Components (ingen HTTP-overhead)
- Block-baserad editor (Lexical) — utbyggbar med quiz, övningar etc.
- 100% TypeScript, versionshantering inbyggd, schemalagd publicering
- Postgres via Supabase, open source, self-hosted

```typescript
// Payload CMS: Content model med versioner + lokalisering + scheduling
export const Course: CollectionConfig = {
  slug: 'courses',
  versions: {
    drafts: { autosave: { interval: 3000 }, schedulePublish: true },
    maxPerDoc: 50,
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'content', type: 'richText', editor: lexicalEditor({
      features: ({ defaultFeatures }) => [
        ...defaultFeatures,
        BlocksFeature({ blocks: [QuizBlock, VideoBlock, ExerciseBlock] }),
      ],
    })},
    { name: 'modules', type: 'array', fields: [
      { name: 'lessons', type: 'relationship', relationTo: 'lessons', hasMany: true },
      { name: 'dripDelay', type: 'number', admin: { description: 'Dagar efter köp' } },
    ]},
    { name: 'accessLevel', type: 'select', options: ['free', 'basic', 'premium', 'enterprise'] },
  ],
}
```

#### Block-baserad Editor

**TipTap + Yjs CRDT:** Notion-liknande editor med realtidssamarbete, slash commands, drag-and-drop.

**Alternativ:** BlockNote (open source Notion-klon ovanpå TipTap/ProseMirror).

#### Lokalisering

**Flöde:** Payload CMS (fältnivå-lokalisering) → Webhook → TMS (Crowdin/Lokalise) → DeepL (maskinöversättning) → Mänsklig granskning → Webhook → Tillbaka till CMS.

---

### 8.2 LMS & Lärande

#### xAPI/cmi5 framför SCORM

```
SCORM = "Eleven klarade provet med 85%"
xAPI  = "Eleven läste artikeln på mobilen, pausade videon vid 3:42,
         löste övning 3 på tredje försöket med 92%"
```

**xAPI-statement:** Actor + Verb + Object + Result + Context + Timestamp.

**cmi5 = xAPI + LMS:** Innehåll kan ligga var som helst (CDN), offline-synk, obegränsad data.

**LRS med Supabase:**
```sql
CREATE TABLE learning_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  verb TEXT NOT NULL,
  object_id TEXT NOT NULL,
  result_score DECIMAL(5,4),
  result_completion BOOLEAN,
  context JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
-- RLS: Användare ser bara sina egna statements
```

#### Adaptiva Lärstigar

**SM-2 Spaced Repetition:** Algoritmen bakom Anki. npm-paket: `supermemo`.

**LECTOR (2025):** LLM-Enhanced Concept-based Test-Oriented Repetition — 90.2% framgång.

**Recommendation Engine-inputs:**
- Kunskapsnivå (diagnostik)
- Historiska prestationer (xAPI/LRS)
- Spaced repetition-schema (SM-2)
- Kompetensramverk (mål-gap)
- Socialt kontext (kohortprestationer)

**Microlearning:** 3-7 min enheter, ett lärandemål per enhet, mobilförst. Marknad: $2.8B → $6.5B (2027).

#### Bedömningsmönster

**Formativ** (under lärande): In-content quizzes, reflektionsfrågor med AI-feedback, peer review.
**Summativ** (efter lärande): Slutprov, projektarbete, portfolio, kompetensdemonstration.
**Single Point Rubric** (trend 2025): En kolumn med förväntningar + "Vad saknas?" + "Vad överträffar?"

---

### 8.3 Event & Live

#### LiveKit (WebRTC)

**Open source SFU (Go).** Self-hosted, gratis. Adaptiv bitrate, simulcast, data channels.

**Hybrid Event-arkitektur:**
```
LIVE SESSION                    ON-DEMAND REPLAY
LiveKit Room ──Recording──→     Inspelning (HLS/DASH)
+ Chat/Polls ──Transcript──→   + Kapitel + Sökbar text
+ Breakout   ──xAPI──→         + xAPI-spårning
```

**Alternativ:** Daily.co (managed, enklare setup), 100ms (managed, <100ms latens).

#### Eventhantering

**Atomisk biljettreservation:**
```sql
CREATE OR REPLACE FUNCTION reserve_ticket(p_event_id UUID, p_user_id UUID)
RETURNS UUID AS $$
  SELECT capacity - sold INTO v_available FROM events WHERE id = p_event_id FOR UPDATE;
  IF v_available <= 0 THEN -- Lägg till på väntelista
  ELSE -- Skapa biljett med 15 min TTL
$$;
```

**Redis Sorted Set** för realtids-väntelista med WebSocket-notifiering.

**QR-incheckning** med Camera API → Realtids-dashboard.

---

### 8.4 Coaching & Personalisering

#### Cal.com (Open Source Bokningssystem)

- 1:1 coaching-sessioner med tillgänglighetshantering
- Webhooks till lärplattformen (automatisk progress tracking)
- Recurring sessions, buffer-tid, tidszoner

#### Mål & Vanespårning

- Streak-system med "grace periods"
- Progressvisualisering (GitHub-style contribution graph)
- Dagliga micro-utmaningar

---

### 8.5 Monetarisering

#### Stripe Entitlements (2025)

```typescript
// Stripe Checkout med prenumeration
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: 'price_premium_monthly', quantity: 1 }],
});

// Drip content: Beräkna vilka moduler som är upplåsta
function getUnlockedModules(course, subscription) {
  const daysSinceStart = differenceInDays(new Date(), subscription.created);
  return course.modules.filter(m => m.dripDelay <= daysSinceStart);
}
```

#### Open Badges v3 + Verifiable Credentials

```json
{
  "@context": ["https://www.w3.org/ns/credentials/v2", "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"],
  "type": ["VerifiableCredential", "OpenBadgeCredential"],
  "issuer": { "id": "https://passionslyftet.se", "name": "Passionslyftet" },
  "credentialSubject": {
    "achievement": {
      "name": "Passionslyftet — Inre Resan (Certifierad)",
      "criteria": { "narrative": "Slutfört alla 8 moduler med minst 80% på varje bedömning" }
    }
  }
}
```

**W3C-standard.** Verifierbar, maskinläsbar, delbar på LinkedIn.

#### Åtkomstkontroll med Supabase RLS

```sql
CREATE POLICY "Users access purchased courses"
  ON course_content FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.user_id = auth.uid()
        AND s.status = 'active'
        AND s.access_level >= course_content.required_level
    )
  );
```

---

### 8.6 Community & Engagemang

#### Kohortbaserade Kurser

**Arkitektur:** Tidsbestämd grupp som går igenom material tillsammans. Peer review-tilldelning, diskussionsforum per kohort, gemensamma deadlines.

#### Gamification bortom Poäng

**Fyra nivåer:**
1. **Mastery-baserad progression:** Lås upp nästa nivå baserat på faktisk kunskap
2. **Social bevisning:** "15 andra i din kohort har klarat denna modul"
3. **Utmaningssystem:** Tidsbegränsade utmaningar med belöningar
4. **Narrativ resa:** Deltagaren är hjälten i sin egen utvecklingsberättelse

#### Notifikationsstrategi

- **Max 3-5 push/vecka** — frequency capping
- **Event-baserade > broadcast** — "Din studiekamrat lämnade feedback" > "Ny kurs tillgänglig"
- **Digest-strategier:** Veckosammanfattning istället för dagliga ping
- **Notification budget per användare** — fördela klokt

---

## 9. Tvärgående Teman & Rekommendationer

### 9.1 Konvergenstrender

Flera mönster konvergerar mot samma principer:

| Princip | Manifestation |
|---------|---------------|
| **Flytta arbete från klient till server/edge** | RSC, Server Islands, Edge-first, Server Actions |
| **Minimera JavaScript på klienten** | Islands, Resumability, Signals (ingen vDOM) |
| **Reagera kirurgiskt, inte brett** | Signals > useState, Fine-grained > Virtual DOM |
| **Servern som sanningskälla** | TanStack Query, RSC, CRDT (lokal kopia synkar) |
| **Rust/Zig som infra-språk** | Rspack, Turbopack, SWC, Biome, Oxlint |

### 9.2 Beslutsmatris: Vilken teknik för vilken app?

| App-typ | Arkitektur | State | Rendering |
|---------|-----------|-------|-----------|
| **Content-sajt/blogg** | Astro Islands | Minimal (URL-state) | Static + Server Islands |
| **E-handel** | Next.js RSC + PPR | TanStack Query + Signals | Streaming SSR |
| **Dashboard/SaaS** | Next.js RSC | Signals + TanStack Query + XState | PPR |
| **Realtid/samarbete** | SolidJS/Svelte | CRDT (Yjs) + Signals | SSR + WebSocket |
| **LMS/kursplattform** | Next.js + Payload CMS | TanStack Query + URL-state | RSC + Streaming |

### 9.3 Rekommenderad Stack för Passionslyftet

| Lager | Val | Varför |
|-------|-----|--------|
| **Framework** | Next.js 15+ (App Router) | RSC + PPR + Server Actions, störst ekosystem |
| **CMS** | Payload CMS (i samma Next.js-app) | Local API, block-editor, versioner, Supabase-kompatibel |
| **Databas** | Supabase (PostgreSQL) | RLS, Realtime, Auth, Storage — redan i stacken |
| **State** | TanStack Query + nuqs (URL-state) | Server-first, minimal klient-state |
| **LRS** | Supabase-tabell (xAPI-format) | Börja enkelt, migrera till dedikerad LRS vid behov |
| **Live/Event** | LiveKit (self-hosted) eller Daily.co (managed) | WebRTC, breakout rooms, inspelning |
| **Betalning** | Stripe (subscriptions + Entitlements) | Drip content, tiered access |
| **Bokning** | Cal.com | Open source, webhooks, tidszoner |
| **Editor** | TipTap + Lexical (via Payload) | Block-baserad, utbyggbar med quiz/övningar |
| **Certifikat** | Open Badges v3 | W3C-standard, LinkedIn-integration |
| **Build** | Turbopack (dev) + Biome (lint/format) | Redan default i Next.js, 65x snabbare lint |
| **Deploy** | Vercel Edge | Sömlöst med Next.js, edge-first |

### 9.4 Implementationsprioritering

```
Fas 1: Grund (vecka 1-4)
├── Next.js 15 + Payload CMS + Supabase
├── Grundläggande kursstruktur med block-editor
├── Stripe subscription + drip content
└── Biome + Turbopack (dev tooling)

Fas 2: Lärande (vecka 5-8)
├── xAPI learning statements (Supabase-tabell)
├── Spaced repetition (supermemo npm)
├── Quiz/assessment-block i Payload
└── Progress dashboard

Fas 3: Community & Live (vecka 9-12)
├── Kohortbaserade kurser
├── LiveKit/Daily.co för live-sessioner
├── Cal.com för coaching-bokning
└── Notifikationsstrategi

Fas 4: Polish (vecka 13-16)
├── Open Badges v3 certifikat
├── View Transitions API
├── Speculation Rules API (prefetch)
├── Accessibility audit (axe-core + manuell)
└── CSP Level 3 + Trusted Types
```

---

## Källmaterial

Denna rapport baseras på 8 djupgående delrapporter med totalt 400+ källor:

1. `webapp-arkitektur-beyond-best-practices.md` — Edge-first, Islands, Resumability, RSC, Composable
2. `web-performance-beyond-best-practices.md` — Streaming SSR, Speculation Rules, View Transitions, INP
3. `state-management-beyond-best-practices.md` — Signals, Fine-grained reactivity, CRDT, XState, URL-state
4. `modern-dx-beyond-best-practices.md` — Monorepo, Type-safe fullstack, AI-assisterad utveckling, Feature flags
5. `frontend-resilience-observability-2025.md` — Graceful degradation, Chaos engineering, OpenTelemetry
6. `web-security-beyond-best-practices-2025.md` — CSP Level 3, Trusted Types, OWASP 2025+, Passkeys
7. `webbtillganglighet-beyond-best-practices.md` — ARIA 1.3, Kognitiv tillgänglighet, EAA 2025
8. `lms-cms-plattform-avancerade-monster.md` — Payload CMS, xAPI, Adaptiv lärning, LiveKit, Open Badges

Alla delrapporter finns i `~/Documents/research/`.

---

*Sammanställd med Claude Code | 2026-04-06*
