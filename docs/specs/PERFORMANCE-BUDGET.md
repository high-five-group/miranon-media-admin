<!-- vale Vale.Terms = NO -->
<!-- DEFERRED: Session 6.6.6 — Vale.Terms canonical-cap fix -->

# PERFORMANCE-BUDGET -- Prestandabudget

*Skapad: 2026-04-07 | Integrerad fran gap-analysis.md (Fas 0, punkt 3 + Del 2, punkt 2)*
*Galler: miranon-media-admin (React 19 SPA)*

---

## 1. Budget per metrik

| Metrik | Budget | Mal | Matning | Varfor |
|--------|--------|-----|---------|--------|
| FCP | <1.5s | <1.0s | web-vitals | Forsta visuella feedbacken |
| LCP | <2.5s | <1.5s | web-vitals | Storsta synliga elementet (dashboard-kort, event-lista) |
| INP | <200ms | <50ms | web-vitals | Varje knapptryck och filter ska kannas omedelbart |
| CLS | <0.1 | <0.05 | web-vitals | Inget far hoppa runt nar data laddar |
| TTI | <3.5s | <2.0s | Lighthouse | Appen ska vara interaktiv snabbt |
| Total JS | <200KB gzip | <150KB gzip | vite-bundle-visualizer | Hal den latt |

**Budget** = blockerar deploy om den overskrids. **Mal** = dit vi optimerar over tid.

---

## 2. Matningsinfrastruktur

### web-vitals setup

```typescript
// src/lib/report-web-vitals.ts
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric: { name: string; value: number; rating: string }) {
  const body = JSON.stringify(metric);
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/vitals', body);
  }
}

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onFCP(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
```

Anropa `reportWebVitals()` fran `main.tsx` efter render.

### Lab vs Field

| Typ | Verktyg | Nar | Begransning |
|-----|---------|-----|-------------|
| **Lab** | Lighthouse CI i GitHub Actions | Varje PR | Simulerad miljo |
| **Field** | web-vitals i produktion (RUM) | Varje sidvisning | Verklig data fran Lottas enhet |

Field-data ar viktigare. Lighthouse kan visa INP 40ms pa en M3 MacBook
medan Lottas aldre iPad visar 350ms. Utan RUM ar vi blinda.

---

## 3. INP-optimering

### scheduler.yield()

Nar tung logik blockerar main thread (filtrering av 500 poster):

```typescript
async function filterAndSort(events: Event[], filters: EventFilters) {
  const filtered = events.filter((e) => matchesFilters(e, filters));
  await scheduler.yield(); // Ge browsern en paus att maala om
  return filtered.sort((a, b) => compareEvents(a, b, filters.sort));
}
```

Skillnad mot `setTimeout(0)`: `scheduler.yield()` atertar med hogre
prioritet an vanliga tasks. Moderna losningen.

### useDeferredValue

For personsok (500+ resultat) -- tangentbordet svarar direkt, listan
uppdateras nar React hinner:

```tsx
function PersonerRoute() {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const isStale = searchTerm !== deferredSearch;

  return (
    <div>
      <input type="search" value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)} placeholder="Sok har" />
      <div style={{ opacity: isStale ? 0.6 : 1 }}>
        {isStale && <PersonListSkeleton />}
        <PersonList searchTerm={deferredSearch} />
      </div>
    </div>
  );
}
```

### content-visibility: auto

For innehall under folden -- browsern skippar rendering tills Lotta scrollar dit:

```css
.content-auto {
  content-visibility: auto;
  contain-intrinsic-size: auto 200px;
}
```

### Web Workers

For operationer >50ms (CSV-export av 2000 rader). Flytta till Worker sa main
thread forblir fri. **Tumregel:** anvand forst nar profiling visar >50ms.
For de flesta CRUD-operationer racker `useDeferredValue` eller `scheduler.yield()`.

---

## 4. Bundle-budget per route

| Route | Max JS (gzip) | Strategi |
|-------|---------------|----------|
| `/login` | 50KB | Minimal -- bara auth |
| `/hem` | 80KB | TanStack Query + dashboard-komponenter |
| `/event` | 100KB | Query + ListItem + TabGroup + filter |
| `/event/$eventId` | 100KB | Query + detalj + registreringar |
| `/personer` | 80KB | Query + sok + ListItem |
| `/mer` | 30KB | Statisk lista |

**Shared bundle (router + React + Query):** ~95KB gzip.

### Code splitting

TanStack Router + Vite splittar automatiskt per route:

```typescript
export const Route = createFileRoute('/_authenticated/event/')({
  component: () => import('./event-component').then((m) => m.EventPage),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(eventListQueryOptions()),
});
```

Verifiera med `npx vite-bundle-visualizer`.

---

## 5. Bildoptimering

| Regel | Implementation | Varfor |
|-------|---------------|--------|
| AVIF med JPEG-fallback | `<picture><source type="image/avif">` | ~50% mindre an JPEG |
| `fetchpriority="high"` | Pa logga och hero-element | Browsern prioriterar forst |
| Lazy loading | `loading="lazy"` under folden | Laddar inte bilder Lotta inte ser |
| Max dimensioner | Logo 64x64, avatar 40x40, hero 600x400 | OverStorlek ar vanligaste felet |

---

## 6. Prefetching & Speculation Rules

### TanStack Router: preload="intent"

Alla `<Link>` i tab bar och listor far `preload="intent"`. Nar Lotta
hovrar startar datahemtningen 200-300ms innan hon klickar:

```tsx
<Link to="/event" preload="intent">Event</Link>
<Link to="/event/$eventId" params={{ eventId: event.id }} preload="intent">
  {event.name}
</Link>
```

### Speculation Rules API

Gar steget langre -- *prerenderar* hela sidan i bakgrunden:

```html
<script type="speculationrules">
{
  "prerender": [
    { "where": { "href_matches": "/hem" }, "eagerness": "eager" },
    { "where": { "href_matches": "/event/*" }, "eagerness": "moderate" },
    { "where": { "href_matches": "/personer" }, "eagerness": "conservative" }
  ]
}
</script>
```

| Eagerness | Triggas | Anvand for |
|-----------|--------|-----------|
| `eager` | Direkt vid sidladdning | `/hem` efter login -- Lotta gar alltid dit |
| `moderate` | Vid hover/pointerdown | Event-detaljer |
| `conservative` | Forst vid klick | Sallan besokta routes |

---

## 7. LoAF debugging

Long Animation Frames API identifierar *vilken* kod som blockerar main thread.
Aktiveras vid debugging nar INP overstiger 200ms:

```typescript
// src/lib/loaf-observer.ts
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 50) {
      console.warn('[LoAF]', {
        duration: `${entry.duration.toFixed(0)}ms`,
        scripts: (entry as any).scripts?.map((s: any) => ({
          sourceURL: s.sourceURL,
          sourceFunctionName: s.sourceFunctionName,
          duration: `${s.duration.toFixed(0)}ms`,
        })),
      });
    }
  }
});

export function startLoAFObserver() {
  observer.observe({ type: 'long-animation-frame', buffered: true });
}
```

**Arbetsflode:** Lotta rapporterar troghet -> aktivera observer -> aterskap
interaktionen -> las loggen -> optimera med yield/deferred/Worker.

---

## 8. CI-integration

### Lighthouse CI i GitHub Actions

```yaml
name: Lighthouse CI
on: [pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci && npm run build
      - uses: treosh/lighthouse-ci-action@v12
        with:
          configPath: ./lighthouserc.json
          uploadArtifacts: true
```

### Lighthouse-budgetar (lighthouserc.json)

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 1500 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "interactive": ["error", { "maxNumericValue": 3500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    }
  }
}
```

### Bundle size check per PR

```yaml
- name: Bundle size check
  run: |
    npm run build
    TOTAL=$(find dist/assets -name '*.js' -exec gzip -c {} \; | wc -c)
    if [ "$TOTAL" -gt 204800 ]; then
      echo "::error::Bundle oversiger 200KB budget: ${TOTAL} bytes"
      exit 1
    fi
```

### web-vitals regressionsvarningar

Field-data fran `sendBeacon` (sektion 2) -> larm om nagon metrik overstiger
budget under en veckas rullande medelvarde. Konfigureras i Sentry Performance
eller en Supabase Edge Function som aggregerar och skickar notifiering.

---

## Sammanfattning

| Omrade | Verktyg | Nar |
|--------|---------|-----|
| Lab-matning | Lighthouse CI | Varje PR |
| Field-matning | web-vitals + sendBeacon | Varje sidvisning i produktion |
| Bundle-kontroll | vite-bundle-visualizer + CI-check | Varje PR |
| INP-optimering | useDeferredValue, scheduler.yield() | Vid interaktionsproblem |
| Prefetching | preload="intent", Speculation Rules | Alla lankar fran start |
| Debugging | LoAF observer | Vid rapporterade problem |

**Principen:** Vi mater fran dag ett. Utan matning vet vi inte om appen
kanns snabb for Lotta -- bara att den kanns snabb for oss.
