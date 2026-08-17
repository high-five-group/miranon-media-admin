/**
 * Sidbytesindikator — lättviktig route-övergångs-indikator (TASK-233).
 *
 * ═══ ROTORSAKEN DEN LÖSER ═══
 *
 * TASK-218.3/ADR-112 lät `src/routes/__root.tsx`s rot-Suspense-fallback
 * (som fångar React.lazy-svängningen `autoCodeSplitting: true`, `vite.
 * config.ts`, skapar per route) ÅTERANVÄNDA Forberedelseskarm — samma
 * helskärms-splash som appstartens startvärmning. Forberedelseskarm.tsx:s
 * EGNA docblock flaggade redan då avvägningen öppet: "route-chunk-
 * nedladdning — ett HELT ANNAT väntoläge än startvärmningens sju
 * hämtningar". Vid en SPA-sidbyte som råkar suspendera på en route-
 * chunk som ännu inte laddats blinkade hela skärmen fram — fel vikt för
 * en normal in-app-navigation (TASK-233, Marcus S102-fynd).
 *
 * ═══ VARFÖR DENNA KOMPONENT + `defaultPendingComponent`, INTE EN
 *     HANDROLLAD "DELAY INNAN FALLBACK VISAS"-WRAPPER ═══
 *
 * Källäst mot den installerade TanStack Router-källan (node_modules/
 * @tanstack/react-router/src/Match.tsx, v1.170.21 — INTE bara dokumenten):
 * varje route-match har sin EGEN `React.Suspense`-gräns
 * (`ResolvedSuspenseBoundary`), men den gränsen degraderar till en
 * `SafeFragment` (INGEN Suspense-gräns alls) om varken ruttens egen
 * `pendingComponent` ELLER routerns `defaultPendingComponent` är satt —
 * exakt vårt läge före denna skiva. En route-chunks kastade promise
 * bubblar då förbi varje mellanliggande lager (inkl. `_authenticated.tsx`s
 * egna gräns) till NÄRMASTE gräns som FAKTISKT är ett `React.Suspense` —
 * rotens, i `__root.tsx`. Det är den bokstavliga mekanismen bakom
 * blinket, inte en gissning.
 *
 * Att i stället linda `__root.tsx`s fallback i en egen CSS-fördröjd
 * (`opacity: 0` + `animation-delay`) wrapper löser INTE problemet: React
 * Suspense avmonterar den TIDIGARE sidans DOM så fort gränsen suspenderar,
 * oavsett om fallback-elementet självt är osynligt eller ej — resultatet
 * blir en blank stund (bakgrundsfärg) i stället för ett brandat blink,
 * inte NOLL störning. `router.ts`s nya `defaultPendingComponent` +
 * `defaultPendingMs` (TanStack Routers EGNA mekanism, `setupPendingTimeout`
 * i `load-matches`-pipelinen) löser det STRUKTURELLT annorlunda: routern
 * väntar med att ens COMMITTA den nya matchen tills `pendingMs` passerat —
 * den GAMLA sidan stannar kvar, synlig, oavmonterad, hela tystnads-
 * fönstret. Ingen DOM försvinner för snabba laddningar ("under tröskeln
 * helt tysta", AC1) — detta går inte att uppnå med en ren CSS-fördröjning
 * på fallback-INNEHÅLLET, bara med en fördröjning av SJÄLVA COMMIT:et.
 *
 * ═══ TRÖSKELVÄRDET — "Lugnt laddläge", INTE kortets egna "~250–300 ms" ═══
 *
 * `router.ts` sätter `defaultPendingMs: 1000` / `defaultPendingMinMs: 500`
 * — ordlistans "Lugnt laddläge" (ORDLISTA.md): *"under 1 sekund visas
 * ingen indikation alls"*, appens ÖVERGRIPANDE, Marcus-grillade
 * (task-7/S63) princip som ADR-113 explicit gör till Laddtrappans
 * "överordnade princip". TASK-233-kortets egna riktvärde ("~250–300 ms")
 * spårades mot sin källa (`forberedelseskarm-splash-branschmonster-
 * 2026-08-16.md` rad ~319) och visade sig gälla en ANNAN fråga —
 * Material 3s ANIMATIONS-durationsskala (kort/medium/lång), WebSearch-
 * syntetiserad och uttryckligen "overifierat ordagrant mot originalet"
 * — inte ett fördröjnings-tröskelvärde för laddindikatorer. 1000/500 ms
 * råkar dessutom vara TanStack Routers EGNA bibliotekets-default (verifierat
 * i samma källa, `router-core/src/router.ts` rad ~1139–1140) — vald
 * EXPLICIT här i stället för att förlitas på tyst default, så en framtida
 * uppgradering av biblioteket inte kan glida under oss.
 *
 * ═══ VISUELLT — ÅTERANVÄNDER SKELETON-SHIMMERN, INTE EN NY KEYFRAME ═══
 *
 * Samma `--animate-skeleton-shimmer`-token (`tailwind.css`, Chung-empirin:
 * långsam svepning) som `Skeleton.tsx` redan bär, applicerad på ett
 * `w-1/3`-segment i stället för hela blocket — ger en "komet"-svepning
 * över hela spårets bredd (samma READ som Material/Chrome/GitHubs
 * indeterminate-topbar-mönster, utan att uppfinna en ny keyframe).
 * `motion-safe:`-gated (base.css:s globala animation-duration-neutralisering
 * står kvar som dubbelbälte): under `prefers-reduced-motion: reduce` körs
 * ANIMATIONEN aldrig — segmentet sitter då kvar i sitt NATURLIGA flow-läge
 * (flush vänster, `w-1/3`), INTE i keyframens `from`-läge (`translateX(-100%)`,
 * off-screen) — CSS-animationer påverkar `transform` bara MEDAN de körs;
 * utan matchande media-query appliceras ingen animation alls, så elementet
 * faller tillbaka till sin vanliga, synliga positionerings-utility. Statisk
 * balk vänster i spåret är alltså en MENINGSFULL, alltid synlig
 * reducerad-rörelse-fallback, inte en osynlig rest.
 *
 * ═══ TILLGÄNGLIGHET ═══
 *
 * Samma tvåkanals-idiom som Forberedelseskarm/Skeleton: den visuella
 * balken är `aria-hidden` (dekorativ, Roselli-mönstret — Skeleton.tsx
 * bär samma), en separat `role="status" aria-live="polite" sr-only`-rad
 * bär det verkliga beskedet. `defaultPendingComponent` renderas UTAN
 * props (TanStack Router, `Match.tsx`: `<PendingComponent />`) — ingen
 * datakontrakt-yta att typa här, till skillnad från Forberedelseskarm.
 *
 * ═══ NAMNET ═══
 *
 * Swedish/ORDLISTA-transriverat (samma konvention som `Forberedelseskarm`,
 * `NastaEventCard`) — "sidbyten" är kortets eget domänord (TASK-233:s
 * titel). Ny ORDLISTA-post, `docs/ORDLISTA.md`.
 */
export function Sidbytesindikator() {
  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-(--mm-sidbytesindikator-track)"
      >
        <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-(--mm-sidbytesindikator-fill) motion-safe:animate-skeleton-shimmer contrast-more:bg-(--mm-sidbytesindikator-fill-contrast)" />
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        Laddar sida
      </p>
    </>
  );
}
