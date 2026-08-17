---
id: TASK-233
title: >-
  Fynd: Förberedelseskärmen mikro-blinkar vid sidbyten - rotens
  Suspense-fallback saknar delay
status: Done
assignee: []
created_date: '2026-08-15 23:43'
updated_date: '2026-08-17 01:53'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 433000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
S102 Lotta-vandringen punkt 10 (Marcus 2026-08-16): 'laddnings-sidan dyker upp en mikro-sekund ibland vid sidbyten, skit störande'. ROTORSAK (kodläst): __root.tsx rad ~43-53 - Suspense-fallbacken för route-Outlet är HELA Forberedelseskarm (218.3/ADR-112 ersatte nakna Laddar-texten). Vid SPA-sidbyten som laddar en lazy route-chunk suspendar React kort och fullskärmen blinkar fram. Skärmen är designad för boot/warmup - som chunk-fallback är den fel vikt. FIX-KLASS (branschmönstret, agenten researchar/väljer): delayed fallback (tyst ~250-300 ms innan något visas - de flesta chunk-laddningar hinner klart) och/eller lättare fallback för route-byten; tyst-vid-varmt-regeln (ADR-112 beslut 2) ska respekteras. BYGGORDNING: EFTER TASK-227 landat - samma domän (gate/skärm-samspelet i main.tsx), kollisionsrisk annars.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Sidbyten blinkar aldrig fullskärmen - chunk-laddningar under tröskeln är helt tysta
- [x] #2 Boot-/kallstartsfallet (218.4-e2e) och 227-fallet opåverkade gröna
- [x] #3 DoD-kvartetten gron
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
VALT MÖNSTER: TanStack Routers egen `defaultPendingComponent` +
`defaultPendingMs`/`defaultPendingMinMs` (router.ts) — INTE en handrullad
CSS-fördröjd Suspense-fallback. Källäst mot installerad källa
(node_modules/@tanstack/react-router/src/Match.tsx v1.170.21): varje
route-match har en egen React.Suspense-gräns som degraderar till en
SafeFragment (ingen gräns alls) om varken ruttens egen pendingComponent
eller routerns defaultPendingComponent finns — exakt vårt läge före denna
skiva. En route-chunks kastade promise bubblade då förbi varje
mellanliggande lager till __root.tsx:s rot-Suspense, som återanvände HELA
Forberedelseskarm (helskärms boot-splash, fel vikt för en sidbyte). Fixen:
defaultPendingComponent (ny lättviktskomponent Sidbytesindikator.tsx,
toppfäst balk + skeleton-shimmer-tokenet) aktiverar VARJE routes EGEN
Suspense-gräns; __root.tsx:s rot-gräns byts till samma komponent som
säkerhetsnät (defense-in-depth, i praktiken sällan träffad numera).

TRÖSKELVÄRDE-AVVIKELSE MOT KORTETS "~250-300 ms" (ADR-086, bokförd öppet):
satte 1000/500 ms i stället. Kortets tal spårades mot sin källa
(docs/research/forberedelseskarm-splash-branschmonster-2026-08-16.md rad
~319) och gäller en ANNAN fråga (Material 3s animations-DURATIONSSKALA,
WebSearch-syntetiserad, uttryckligen "overifierat ordagrant mot
originalet") — inte ett fördröjnings-tröskelvärde för laddindikatorer.
ORDLISTA.md "Lugnt laddläge" (task-7/S63, Laddtrappans egen "överordnade
princip" per ADR-113) säger explicit "under 1 sekund visas ingen
indikation alls" — appens redan etablerade, Marcus-grillade regel för
EXAKT denna fråga. 1000/500 ms råkar dessutom vara TanStack Routers egna
bibliotekets-default (källäst, router-core/src/router.ts rad ~1139-1140)
— satt EXPLICIT i stället för att förlita sig på tyst default. Regeln i
uppdraget slår talet i uppdraget.

KÄLLOR: (1) NN/g Response Time Limits (redan i repots research-korpus,
citerad av ADR-112) — grunden för "ingen indikation under ~1 s". (2)
TanStack Router-källkoden (Match.tsx + router-core/router.ts), källäst
live mot installerad v1.170.21/v1.171.21 — INTE bara dokumenten (docs
kollades via context7 men källan var det som avgjorde). (3)
forberedelseskarm-splash-branschmonster-2026-08-16.md — konsulterad,
dess "~250-300 ms"-siffra visade sig gälla en annan fråga (se ovan).

VISUELLT: återanvänder EXAKT samma --animate-skeleton-shimmer-token och
after-overlay-mönster som Skeleton.tsx (ingen ny keyframe), omfärgad med
egna komponent-tokens (--mm-sidbytesindikator-*, INTE en återanvändning av
--mm-forberedelseskarm-bar-* — namn-smell, se components.css-kommentaren).
Under reduced-motion sitter fyllnadssegmentet kvar SYNLIGT i sitt naturliga
flow-läge (inte keyframens off-screen from-läge) — CSS-animationer
påverkar transform bara medan de körs.

FÖRSTA PREMISS-DIVERGENS (empiriskt, viktig): en direkt A/B (git stash,
samma throttlade browser-test, login→glomt-losenord under Slow 3G + 4x
CPU både i dev-server och i en riktig produktionsbygge/vite-preview) visade
att FÖRE-koden INTE visar Forberedelseskarm alls för den transitionen —
routern höll bara den GAMLA sidan tyst tills allt var klart, utan att
någonsin försöka rendera den nya matchen (ingen suspend uppstod). EFTER-
koden visade korrekt Sidbytesindikator (aldrig Forberedelseskarm) efter en
äkta trög laddning. Mekanismen är alltså bevisat KORREKT byggd och
verifierad att den triggar rätt komponent när den väl behövs — men jag
kunde INTE reproducera det UR-SPRUNGLIGA blinket för just denna
transitions-form (två syskonlösa toppnivå-routes). Trolig verklig
scenario-klass (ej empiriskt bekräftad av mig): nästlade
_authenticated-barn-routes (Hem→Event, samma flikbyte 218.4-testet redan
övar) — jag försökte reproducera DEN scenario-klassen med en fristående
Playwright-session (auth-injektion via storageState mot en egen
dist-preview-server) men fastnade på ett auth-igenkänningsproblem
utanför själva fixens scope (samma injicerade session funkade för
projektets EGNA e2e-auth-setup mot 5173, men inte mot min fristående
preview-port) — bokfört öppet som en TÄCKNINGSLUCKA i min verifiering,
inte en motbevisning av fixen.

218.4/227-E2E: körde persist-cache.staging.test.ts skarpt
(chromium-authenticated). 7/10 fällde uniformt på "Signe Sparad"-länken
(12s timeout) — DIFFERENTIAL-testat (git stash → samma fällning på
OFÖRÄNDRAD baseline-kod) => INTE en regression av denna skiva. Screenshot
av en fällning visar Hem korrekt renderad (H1 "Hej Lotta", "0 nya
anmälningar", "0 förfallna betalningar") — själva boot/render-flödet
fungerar, det är testets DATA-assertion ("Signe Sparad" i just den
sentinel-posten) som inte matchar aktuellt staging-läge just nu (samma
klass av staging-datahygien/rate-limit-mönster som task-227 och task-236
redan dokumenterat för samma testfil). CI:s Staging-jobb är den
avgörande grinden per etablerad praxis (CONTRIBUTING.md).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängd av orkestreraren 2026-08-17: PR #1463 mergad via kön (grönt krav); efterföljande post-merge på trädet (5b71dcbb) grön. Marcus praktikbevis (blink-frihet i prod) är öppen bevakning, bokförd i sessionsdok.
<!-- SECTION:FINAL_SUMMARY:END -->
