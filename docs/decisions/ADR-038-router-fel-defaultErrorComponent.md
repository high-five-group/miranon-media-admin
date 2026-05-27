# ADR-038: Router-fel-fångst via defaultErrorComponent

- Status: Accepted (Session 7 K0.3b 2026-05-27)
- Datum: 2026-05-27
- Fas: Session 7 K0 (Fas 2 11/10-verification — Fynd 4)

## Kontext

Fas 2:s DoD-rad 8 (`[GA]`): "Error boundary på root fångar router-fel och visar fallback med 'ladda om'-knapp". Fynd 4 (Fas 2 11/10-verification) ifrågasatte om detta var uppfyllt. K0.3a:s empiriska fel-test (tre injicerade fel, observerat vad som renderas + om felet når Sentry-capture-vägen) gav en nyanserad bild:

| Plats | Fångades av (FÖRE) | Renderade (FÖRE) |
|---|---|---|
| Loader-/beforeLoad-fel | `Sentry.ErrorBoundary` (`__root.tsx`) | App-fallback "Något gick fel" + "Ladda om" ✓ |
| Route-komponent-render-fel | `Sentry.ErrorBoundary` (`__root.tsx`) | App-fallback ✓ |
| **Root-route-render-fel** (`RootLayout`) | TanStacks inbyggda catch-boundary | **Obrandad default "Something went wrong! / Hide Error"** ✗ |

Verklig lucka: **root-route-fel** kan `Sentry.ErrorBoundary` inte fånga (den renderas av `RootLayout`, som kastade) → TanStacks obrandade default visades, inte app-fallbacken. TanStack varnade explicit: "consider setting an `errorComponent` in your RootRoute!". Under-root-fel (loader/komponent) hanterades däremot redan av `Sentry.ErrorBoundary`. Alla tre nådde Sentry i prod via `createRoot` `onCaughtError` → `Sentry.reactErrorHandler` (TanStacks CatchBoundary är en React-error-boundary). Hypotesen "router-fel når inte Sentry" var alltså falsk; den enda faktiska defekten var den obrandade fallbacken för root-route-fel.

[`router.ts`](../../src/router.ts) saknade `defaultErrorComponent`, `errorComponent` och `defaultNotFoundComponent`. Ingen ADR styrde fel-hanteringen.

## Beslut

`createRouter` får en **`defaultErrorComponent`** ([`src/components/RouteErrorFallback.tsx`](../../src/components/RouteErrorFallback.tsx)) — en branded fallback ("Något gick fel" + "Ladda om"-knapp, `window.location.reload()`) som ersätter TanStacks obrandade default för **alla** router-livscykelfel, inklusive root-route-fel. Fallbacken är visuellt identisk med `Sentry.ErrorBoundary`-fallbacken i `__root.tsx` så att användaren ser samma fallback oavsett fångst-väg.

**Sentry-capture sker via den befintliga `createRoot` `onCaughtError`-hooken** ([`main.tsx`](../../src/main.tsx)) — **ingen `onError`/`onCatch` läggs på routern**, eftersom det skulle riskera dubbel-rapportering (samma fel via både `onError` och `onCaughtError`).

## Alternativ som övervägdes

**`errorComponent` på root-routen** (`createRootRouteWithContext()({ errorComponent })`). Förkastat: `defaultErrorComponent` är router-global och täcker även framtida routes utan egen `errorComponent` — bredare och mindre att glömma. (TanStacks varning föreslog root-route-`errorComponent`; `defaultErrorComponent` uppfyller samma syfte router-globalt.)

**`onError`/`onCatch` på routern för Sentry-rapportering.** Förkastat: `createRoot` `onCaughtError` fångar redan (TanStacks CatchBoundary är en React-EB → hooken fyrar); en extra `onError` skulle dubbel-rapportera.

## Konsekvenser

**Empiriskt kontrast-bevis (K0.3b, samma tre injektioner):**

| Plats | EFTER (med `defaultErrorComponent`) | `onCaughtError` |
|---|---|---|
| Loader-fel | **`defaultErrorComponent`** (branded, markör verifierad) | 1× ✓ |
| Route-komponent-fel | **`defaultErrorComponent`** (branded) | 1× ✓ |
| **Root-route-fel** | **`defaultErrorComponent`** (branded) — TanStack-varningen **borta** | 1× ✓ |

Root-route-fel ger nu branded "Ladda om"-fallback (DoD-rad 8 uppfylld för alla router-fel). `onCaughtError` fyrar fortfarande 1× per fel → Sentry-capture intakt i prod, ingen observerad dubbel-rapportering. Dagens bevis: empiriskt kontrast-test + typecheck/Biome rena (deterministiskt komponent-test för fallback-rendering hör i Fas 3.5-test-infran, jämför [ADR-037](ADR-037-auth-resolution-render-gate.md)).

**Öppna frågor — denna ADR avgränsar sig medvetet (samlas till uppföljande fel-hanterings-arkitektur-konsoliderings-ADR, se [`tasks/todo.md`](../../tasks/todo.md)):**

1. **`Sentry.ErrorBoundary`:s roll efter `defaultErrorComponent`.** K0.3b visade att `defaultErrorComponent` nu fångar loader-/komponent-/root-route-fel — alltså fångar `Sentry.ErrorBoundary` inte längre route-fel (de avbryts av TanStacks boundary under den). Dess kvarvarande unika täckning är near-zero (root-route-interna fel fångas av TanStack, inte av den). Bör den behållas, omdefinieras eller tas bort? (`Sentry.ErrorBoundary` hålls **orörd** i K0.3b — scope-disciplin.)
2. **Render-gate-ytan.** Fel i `AuthProvider`/`InnerApp` (under auth-resolution, före `<RouterProvider>` mountas, [ADR-037](ADR-037-auth-resolution-render-gate.md)) ligger utanför både routerns catch och `Sentry.ErrorBoundary` → fångas bara av `createRoot` `onUncaughtError`. Ingen branded fallback för den ytan.
3. **Capture-vägs-konsolidering.** `onCaughtError` + `Sentry.ErrorBoundary` + (ev. framtida) `onError` bör konsolideras till en medveten, dedupe:ad capture-strategi.
