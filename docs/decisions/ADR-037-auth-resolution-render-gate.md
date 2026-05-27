# ADR-037: Auth-resolution render-gate

- Status: Accepted (Session 7 K0.2b 2026-05-27)
- Datum: 2026-05-27
- Fas: Session 7 K0 (Fas 2 11/10-verification — Fynd 2 + 3)

## Kontext

Fas 2:s skyddade routes använde "optimistic auth": [`_authenticated.tsx`](../../src/routes/_authenticated.tsx) `beforeLoad` gjorde `if (context.auth.isLoading) return;` — en **synkron no-op-return**. TanStack Routers `beforeLoad` blockerar barn-render endast genom att `throw`:a (redirect/error) eller `await`:a en promise; en synkron return tillåter routen att fortsätta. Resultat: medan `AuthProvider` löste sin `getSession()` (isLoading=true) renderades den skyddade route-komponenten → **flash av skyddat innehåll** innan redirect till `/login`. Samma livscykel-brist fanns i tre vektorer (Fas 2 11/10-verification, Fynd 2 + 3):

- [`_authenticated.tsx`](../../src/routes/_authenticated.tsx) — flash av skyddat innehåll (Fynd 2).
- [`__root.tsx`](../../src/routes/__root.tsx) `<Suspense>` — antogs visa laddnings-UI under auth-resolution (DoD-rad 7), men `AuthProvider` använder `useState`/`useEffect` och kastar ingen promise → Suspense suspenderar aldrig för auth (Fynd 3).
- [`index.tsx`](../../src/routes/index.tsx) (`/`) — saknade isLoading-hantering helt → en inloggad användare på `/` redirectades till `/login` under loading-fönstret (egen flash-vektor, funnen K0.2a).

Slutläget var verifierat (K4.3-sviten), men no-flash-semantiken var varken bevisad eller bevisbar från koden.

**Andra halvan av invarianten (empiriskt funnen, K0.2b DEL 4b):** Routern skapas på modul-scope i [`router.ts`](../../src/router.ts) med `context.auth = undefined as unknown as AuthContextValue`; den riktiga auth-contexten injiceras via `<RouterProvider context={{ auth }}>` i `InnerApp`. En render-gate som **inte** monterar `<RouterProvider>` under isLoading måste därför också säkra att inget annat triggar router-bearbetning mot den odefinierade default-contexten. `router.invalidate()` i `InnerApp`:s `useEffect` (K4.3:s login/logout-re-eval) fyrar på första rendern (isLoading=true) och processade beforeLoad mot `context.auth = undefined` → krasch `Cannot read properties of undefined (reading 'isAuthenticated')`. Render-gaten har alltså **två kopplade delar**.

## Beslut

`InnerApp` ([`main.tsx`](../../src/main.tsx)) render-gate:ar auth-resolution. **Invariant: `context.auth` är definitiv (`isLoading === false`) när VARJE `beforeLoad` körs.** Två kopplade delar:

1. **Mount-gate:** medan `auth.isLoading` renderar `InnerApp` en laddningsindikator (`role="status"`, `aria-live="polite"`, matchar `__root.tsx` Suspense-fallbacken); `<RouterProvider>` monteras först när `isLoading === false`.
2. **Guardad invalidate:** `router.invalidate()` körs endast `if (!auth.isLoading)`. Gaten sköter **initial** resolution (RouterProvider mountas fräscht med löst auth); invalidate sköter **senare** auth-byten (login/logout, då isLoading redan är false). Utan guarden fyrar invalidate mot undefined router-context → krasch (ovan).

Följd: [`_authenticated.tsx`](../../src/routes/_authenticated.tsx)/[`index.tsx`](../../src/routes/index.tsx)/[`login.tsx`](../../src/routes/login.tsx) `beforeLoad` förenklas — ingen route hanterar längre isLoading (gaten garanterar att den är false).

## Alternativ som övervägdes

**(b) `beforeLoad` await:ar en auth-ready-promise** per route. Förkastat: per-route-kontrakt i stället för en global invariant — fler ställen att glömma, och `AuthProvider`:s kontrakt måste utökas med en ready-promise.

**(c) Suspense-baserad auth-resolution** (`AuthProvider` kastar promise). Förkastat: skriver om en fungerande `AuthProvider`; Suspense gateer dessutom render, inte router-`beforeLoad`, och den befintliga Suspense-boundaryn ligger under `RouterProvider` → arkitektoniskt fel placering för auth-gating.

**Invalidate-hantering: seed:a `router.context.auth` med en non-undefined default** i stället för guard. Förkastat: med de förenklade beforeLoads (ingen isLoading-gren) skulle en default `isAuthenticated: false` ge prematur redirect/flash under loading. Guarden är den rena lösningen.

## Konsekvenser

**No-flash strukturellt utesluten (resonemangs-kontrast-bevis):**

- *Pre-fix:* `InnerApp` monterar `<RouterProvider>` omedelbart, även medan `isLoading=true` → `beforeLoad` körs → den synkrona `if(isLoading) return` är no-op → route-komponenten (skyddat innehåll) renderas före auth-resolution → **flash**.
- *Post-fix:* `<RouterProvider>` monteras **aldrig** medan `isLoading=true` → ingen `beforeLoad` körs, ingen route-komponent renderas under loading → flash är strukturellt utesluten, inte bara osannolik.

Detta är ett **strukturellt/resonemangs-bevis**. Det deterministiska regressionslåset (komponent-test som styr `auth.isLoading` direkt och asserterar att `<RouterProvider>`/skyddat innehåll ej renderas under loading, samt faller mot pre-fix-koden) kräver `vitest` — medvetet deferrat till Fas 3.5 (Gate 1-beslut 2026-05-13, `vitest` ej installerat) och spec:at i [`tasks/todo.md`](../../tasks/todo.md). Dagens bevis: strukturellt kontrast-bevis + K4.3-sviten 7/7 grön (setup + 6 tester, inkl. Test 4 + Test 6 invalidate-interaktionen).

Övrigt: `__root.tsx` `<Suspense>` lämnas — den är korrekt för lazy route/code-splitting, den var bara aldrig auth-gaten. DoD-rad 7:s mekanism omtolkas: intentionen "laddningsindikator under auth-resolution" uppfylls av render-gate-splashen i stället för Suspense (se BUILD-LOG DoD-tabell). Ingen befintlig ADR motsägs; ADR-026/027/028 (Fas 2) rör inte auth-resolution.
