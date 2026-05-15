# SPA-ARCHITECTURE-DECISION -- Arkitekturbeslut: SPA vs SSR

*Skapad: 2026-04-07 | Integrerad fran gap-analysis.md (Del 2, punkt 1)*
*ADR (Architecture Decision Record)*
*Galler: miranon-media-admin (React 19 SPA)*

---

## Status

**Beslut fattat: Vite SPA** (inte Next.js App Router, inte Astro).

---

## Kontext

Research-rapporten (beyond-best-practices-2026.md) rekommenderar:

- React Server Components + PPR (Next.js 15+) for content-tunga appar
- Islands Architecture (Astro) for content-first sajter
- Edge-first architecture for global latensreduktion

Miranon Media Admin ar en admin-app for 1-2 anvandare (Lotta + Roger)
med enbart autentiserat innehall. Inga publika sidor, ingen blogg,
ingen sokmotoroptimering.

Gap-analysen (punkt 1, Del 2) identifierade att SPA-beslutet saknades
som explicit arkitekturdokument. Detta ADR atgardar det.

---

## Beslut

Vi valjer **Vite SPA** med React 19, TanStack Router och TanStack Query.

---

## Argument FOR SPA

### 1. Admin-app utan SEO-krav

Inget offentligt innehall att indexera. Inga sokmotorer behover crawla.
Alla sidor kraver autentisering -- en sokmotor skulle aldrig se nagon data.
Googles crawler loggar inte in.

### 2. Inget offentligt innehall att pre-rendera

Ingen landing page, ingen blogg, ingen marknadsforing. All data ar
dynamisk och personlig: Lottas event, anmalningar, betalningar.
Pre-rendering av dynamisk data ar meningslos -- den ar outdated
innan sidan laddas.

### 3. Vite bevisat i Vue-projektet

27 sessioner med Vite -- bevisad robust. Samma dev-server, samma
build-pipeline. HMR (Hot Module Replacement) fungerar pa <100ms.
Minimerar inlarningskurva och eliminerar risk med ny bundler.

### 4. Enklare deploy

Statiska filer → Vercel/Netlify utan serverkomponent. Inga
server-kostnader per request. Inga cold starts. Inga
serverlosa funktioner for rendering. CDN cachelar allt.

**Deploy-pipeline:**

```text
git push → Vercel build (npm run build) → statiska filer → CDN → klart
```

Ingen server att underhalla. Ingen Node.js-runtime i produktion.
Ingen serverless function invocation-kostnad.

### 5. TanStack Router overlagset for admin-SPA

TanStack Router ar designat for SPA:er med type-safe search params.
Zod-validering, hierarkiskt arv, hover-prefetch -- allt fungerar
klientside utan server.

| Feature | TanStack Router (SPA) | Next.js App Router (SSR) |
|---------|----------------------|--------------------------|
| Search params | Zod-validerat, type-safe | Manuellt (URLSearchParams) |
| Prefetching | `preload="intent"` | Automatiskt via RSC |
| DevTools | Dedikerade | Inga dedikerade |
| Code splitting | Vite-baserat, automatiskt | Webpack/Turbopack-baserat |
| Loaders | Klient-side, seedar TanStack Query | Server-side, RSC-baserat |

80% av Lottas interaktioner ar filter, sortering och paginering.
TanStack Routers search params eliminerar en hel kategori boilerplate
som Next.js App Router inte loser lika elegant for klient-tungt arbete.

---

## Argument MOT SSR/Next.js (for denna app)

### 1. Server Components onoddiga

All data hamtas via TanStack Query (klient-cache). Ingen data ska
renderas server-side. Server Components loser ett problem vi inte har:
att skicka HTML fran server till klient for forsta rendering. Var
forsta rendering ar en tom app-shell -- datan kommer fran Airtable/
Supabase via API-anrop, inte fran servern.

### 2. Streaming SSR onodigt

App-shell laddas en gang → allt dynamiskt via TanStack Query.
Ingen multi-sektions-sida som behover progressiv rendering.
Lottas dashboard ar EN vy med parallelll datahantaring -- inte en
lång sida som renderas uppifraan och ner.

### 3. Edge rendering onodigt

1-2 anvandare i Sverige -- latensoptimering ar irrelevant.
Supabase region: EU (Frankfurt). Airtable: US, men via Edge Function
i EU. Skillnaden mellan 20ms och 5ms TTFB ar omardkbar for Lotta.

### 4. Okad komplexitet utan vinst

| Komplexitet | SPA (Vite) | SSR (Next.js) |
|------------|-----------|---------------|
| Server/klient-grans | Existerar inte | `use client`, `use server` overallt |
| Deploy | Statiska filer | Server-infrastruktur (Node.js eller edge) |
| Hydration | Ingen | Edge cases (hydration mismatch) |
| Mental modell | Allt ar klient | Tva varldar (server + klient) |
| Bundler | Vite (bevisad) | Turbopack (nyare, farre erfarenheter) |
| Cachning | TanStack Query (enkel) | Server cache + klient cache (komplex) |

Komplexiteten i Next.js App Router ar motiverad nar man bygger en
publik app med SEO-krav, statiskt innehall och dynamiska sektioner.
For en admin-app bakom login ar det overhead utan vinst.

---

## Konsekvenser

### Negativa (och mitigation)

| Konsekvens | Varfor det spelar roll | Mitigation |
|-----------|----------------------|-----------|
| Ingen streaming SSR → langre FCP | Anvandaren ser en vit sida tills JS laddats | Service worker cache-first for app-shell (pseudo-SSR). Se PERFORMANCE-BUDGET.md |
| Ingen edge rendering | API-anrop gar fran klient, inte fran nara server | Supabase Edge Functions redan i EU. Acceptabel latens |
| Inget PPR (Partial Prerendering) | Ingen mix av statisk/dynamisk | TanStack Query `staleTime` + Speculation Rules. Se PERFORMANCE-BUDGET.md sektion 6 |
| Inget RSC → all JS i klient-bundle | Storre bundle an med server components | React.lazy per route + bundle budget (<200KB gzip). Se PERFORMANCE-BUDGET.md sektion 4 |
| Inget inbyggt SEO | Sokmotorer ser ingenting | Irrelevant -- appen ar bakom login |

### Positiva

| Fordel | Varfor det spelar roll |
|--------|----------------------|
| Enklare mental modell | Allt ar klient -- ingen server/klient-grans att navigera |
| Snabbare iteration | Inga hydration-buggar, ingen server-build-steg |
| Billigare drift | Statiska filer pa CDN -- noll serverkostnad for rendering |
| Bevisat i Vue-projektet | 27 sessioner, inga Vite-relaterade problem |
| Snabbare CI | Inget server-build-steg -- bara `vite build` |
| Fullt oberoende av hosting | Fungerar pa Vercel, Netlify, Cloudflare Pages, S3 |

---

## Framtidsovervagande

### Passionslyftet har ANDRA krav

Passionslyftet (framtida LMS/coaching-plattform) har fundamentalt
annorlunda egenskaper:

| Aspekt | Miranon Admin | Passionslyftet |
|--------|-------------|----------------|
| Publika sidor | Nej | Ja (landningssida, kurskatalog, priser) |
| SEO | Irrelevant | Kritiskt (Google ska hitta kurser) |
| Anvandare | 1-2 (admin) | Hundratals (deltagare + coacher) |
| Innehallstyp | Dynamisk data | Mix av statiskt + dynamiskt |
| Global latens | Irrelevant (Sverige) | Relevant (potentiellt internationellt) |
| Pre-rendering | Onodigt | Nodvandigt for kurskatalog |

**For Passionslyftet ar Next.js App Router eller Astro ett starkt val.**
Content-tunga sidor (kursbeskrivningar, prisplaner) pre-renderas.
Interaktiva delar (dashboard, kursplayer) renderas klientside.

**Det beslutet ar SEPARAT.** Passionslyftet kan anvanda Next.js App Router
medan Miranon Admin forblir SPA. Komponentbiblioteket (React Aria + CVA +
Tailwind) fungerar i bada. Se FUTURE-COMPAT.md for detaljer.

### Vad som delas mellan projekten

| Lager | Delbart? | Kommentar |
|-------|---------|-----------|
| Komponentbibliotek | Ja | React Aria + CVA + Tailwind ar framework-agnostiskt |
| Token-system | Ja | CSS custom properties fungerar overallt |
| Domain-modeller | Ja | Rena TypeScript-typer |
| DataSourceAdapter | Ja | Interface fungerar i bade SPA och SSR |
| TanStack Query hooks | Ja | Fungerar identiskt i Next.js |
| TanStack Router | Nej | Ersatts av Next.js App Router i Passionslyftet |
| Vite-config | Nej | Ersatts av Next.js/Astro-config |

---

## Alternativ som overvagdes

### Next.js App Router

**Eliminerat for att:** Server Components, streaming SSR och edge rendering
loser problem som en 1-2-anvandare admin-app bakom login inte har.
Komplexiteten i server/klient-gransen (use client, use server)
motiveras inte av nagon funktionell vinst.

### Astro

**Eliminerat for att:** Islands Architecture ar optimerat for
content-first sajter med lite interaktivitet. En admin-app ar
*enbart* interaktivitet -- varje vy ar dynamisk. Astro:s styrka
(noll JS for statiskt innehall) ar irrelevant har.

### Remix / React Router v7 (Framework mode)

**Eliminerat for att:** Saknar TanStack Routers type-safe search params
(Zod-validering). Saknar dedikerade DevTools. Ingar TanStack Query
behover manuell cache-hantering. Rimligt alternativ men svagare for
admin/dashboard-appar.

---

## Relaterade beslut

| Dokument | Relation |
|----------|----------|
| PERFORMANCE-BUDGET.md | Hur vi kompenserar utan SSR (service worker, Speculation Rules, bundle budget) |
| URL-STATE-SPEC.md | TanStack Router search params + nuqs for komponent-niva URL-state |
| FUTURE-COMPAT.md | Hur komponentbiblioteket fungerar i bade SPA och SSR (Passionslyftet) |
| conversion-plan.md | Komplett konverteringsplan Vue → React med Vite SPA som grund |
| gap-analysis.md | Analysen som identifierade att detta ADR saknades (Del 2, punkt 1) |

---

*ADR fattat: 2026-04-07*
*Beslutare: Marcus Johansson + Claude Code*
*Nasta review: Vid Passionslyftet-planering (separat SPA vs SSR-beslut)*
