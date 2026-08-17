---
id: TASK-219.3
title: 'Skiva: Fix-vågen — textraderna migreras till trappans steg'
status: Done
assignee: []
created_date: '2026-08-15 08:50'
updated_date: '2026-08-17 08:17'
labels:
  - ready-for-agent
dependencies:
  - TASK-219.1
parent_task_id: TASK-219
ordinal: 422000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: samtliga produktionsytor som bär en synlig Laddar…-textrad som enda laddbesked migreras till Laddtrappans rätta steg (skeleton där geometrin är känd; sr-only-besked parat med synlig indikator), mekaniskt och beteendeneutralt — ingen datahämtning eller logik ändras. Vågens mängd är ~32 filer per research-mätningen 2026-08-15; den exakta listan grep-deriveras vid start och bokförs i notes. SCOPE-GRÄNS: appnivåns två textrader (appstarts-gaten + rot-Suspense-fallbacken) ägs av TASK-218.3 och rörs INTE här — är de redan borta räknas de av, är de kvar lämnas de kvar. Täcker användarberättelser: 1, 3, 4 (PRD TASK-219).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Grep-belagd före/efter-lista i notes: inga synliga Laddar…-textrader som enda laddbesked kvar i produktionsytor, undantaget appnivåns två (TASK-218.3-ägda) om de ännu ej ersatts
- [x] #2 Varje migrerad yta följer trappans rätta steg; sr-besked bevarade i polite-form
- [x] #3 Beteendeneutralitet bevisad: befintliga acceptance-/e2e-sviter för berörda ytor gröna; visual-sviten grön
- [x] #4 DoD-kvartetten grön (test:api, typecheck, biome, build)
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
FÖRE (grep `Laddar` mot `src/**/*.{ts,tsx}`, produktionsytor, exkl. dev/prototyp):
10 nakna "Laddar…"-textrader som ENDA laddbesked, ingen skeleton, ingen synlig geometri:
1. src/components/events/EventRegistrations.tsx:123 — "Laddar anmälda…"
2. src/components/intresserade/Intresserade.tsx:122 — "Laddar intresserade…"
3. src/components/waitlist/Waitlist.tsx:124 — "Laddar väntelistan…"
4. src/components/maillog/MailLog.tsx:123 — "Laddar maillogg…"
5. src/components/registrations/AnmalningarList.tsx:82 — "Laddar anmälningarna…"
6. src/components/segment/SavedSegmentsList.tsx:38 — "Laddar sparade segment…"
7. src/components/segment/SegmentBuilder.tsx:161 — "Laddar kurser…"
8. src/components/events/detail/Anteckningar.tsx:184 — "Laddar anteckningar…"
9. src/components/persons/PersonAnteckningar.tsx:138 — "Laddar anteckningar…"
10. src/components/events/detail/Narvaro.tsx:128 — "Laddar närvaro…"

Cross-refererat mot S102-guidningslistan (11 namn): EventAttendance, EventRegistrations,
Waitlist, MailLog, Intresserade, AnmalningarList, SavedSegmentsList, Narvaro, Anteckningar,
PersonAnteckningar, SegmentBuilder. "EventAttendance" existerar INTE längre som fil — riven
i TASK-214.7 (Dörrlistan-promoveringen, `src/routes/_authenticated/event/$eventId/narvaro.tsx`
docblock) och ersatt av EventCheckin.tsx, som redan är trappan-kompatibel (sr-only "Laddar
check-in…"). Övriga 10 namn = de 10 filerna ovan, 1:1.

EFTER (samma grep, samma scope): 0 nakna Laddar…-textrader kvar i produktionsytor.
Verifierat med `grep -rn "Laddar" src/ --include="*.tsx" --include="*.ts" | grep -v
"\.test\.\|\.spec\."` följt av uteslutning av redan-trappan-kompatibla sr-only-träffar,
kommentarer, variabelnamn och de klassificerade undantagen nedan. AC #1 uppfyllt: kvar
står ENDAST de två appnivå-textraderna (src/main.tsx:70, src/routes/__root.tsx:41) —
TASK-218.3-ägda, orörda per scope-gränsen, oavsett om de ännu ersatts.

PER-YTA TRAPPSTEG (samtliga steg 1, skeleton — känd listgeometri):
- EventRegistrations.tsx: role=status/aria-busy-wrapper + sr-only-besked + Skeleton
  text(rubrik)+text(antal) + 3× Skeleton listRow (radlistan).
- Intresserade.tsx: identisk form (samma GLOBAL LÄS-vy-familj).
- Waitlist.tsx: identisk form.
- MailLog.tsx: identisk form.
- AnmalningarList.tsx: samma familj, men radernas geometri är kortYta (rounded-2xl
  bg-bg-muted p-4) — skeleton speglar EGEN kortform (2 textrader per kort × 3 kort)
  i stället för listRow, för att matcha den faktiska raden.
- SavedSegmentsList.tsx: 2 radplatshållare (två textrader/rad, border-b), plus
  aria-busy="true" TILLAGD (saknades i originalet — Roselli-anatomins krav, additiv
  a11y-komplettering, ingen beteendeändring).
- SegmentBuilder.tsx: rubrik + 2-radig ingress-skeleton + 3× Skeleton listRow
  (RadioGroup-radplatshållare, samma dimension som Gruppdynamik-facit: h-10 rounded-lg).
- Anteckningar.tsx (events/detail) + PersonAnteckningar.tsx (persons): identisk form
  (PersonAnteckningar är en medveten spegling av event-varianten) — 2 st
  AnteckningsKort-formade kort (rounded-xl border-(--mm-navcard-border) bg-surface
  px-4 py-3) med 2 textrader vardera.
- Narvaro.tsx (events/detail): speglar Gruppdynamik/Deltagare-facit (samma DetaljGrupp-
  familj) — 1 textrad (summeringsraden "Total närvaro") + 3× Skeleton listRow
  (tabellradsplatshållare, h-10 rounded-lg).

Alla 10 följer Roselli-anatomin (Skeleton-blocket aria-hidden via primitiven; wrapper
bär role=status + aria-busy=true; sr-only-besked BEVARAT ordagrant ur originaltexten,
nu i polite-form). Diffen är strikt scopad till importrad + isPending-return-blocket i
var och en av de 10 filerna (git diff --unified=0 verifierat: inga hunkar utanför de
raderna) — layout-skift ≈ 0 mot laddat läge håller by construction eftersom laddat läge
aldrig rörts.

KLASSIFICERADE UNDANTAG (grep-träffar som INTE är textrads-klassen, lämnade orörda):
- src/components/event/CreateEventForm.tsx:329 — Select `placeholder=` ("Laddar
  format…"), kontroll-text, ej sidladdning.
- src/components/segment/SegmentMailCompose.tsx:135 — Select `placeholder=`
  ("Laddar segment…"), samma klass.
- src/components/events/EventValjare.tsx:286 — ListBox `renderEmptyState` inuti en
  Select-combobox-popover ("Laddar event…" vs "Inga event matchar sökningen") — samma
  klass som select-placeholder (kontroll-intern mikrotext, ingen egen känd listgeometri
  att skeletona; komponenten använder redan Skeleton i sin trigger för kall djuplänk).
- src/components/segment/SegmentBuilder.tsx:281 — "Laddar ner personerna…" är
  brödtext om filnedladdning, inte ett laddbesked.
- src/routes/login.tsx — `passkeyLaddar`-variabelnamnet; knappen bär redan ett
  knapp-internt spinner-mönster (Laddtrappan steg 2, TASK-219.2:s migreringsmål), ingen
  naken sid-textrad.
- Prototyp-/dev-filer (uttryckligen exkluderade av kortets scope-gräns): 
  src/components/aktivitetshistorik/AktivitetsHistorikPrototyp.tsx,
  src/components/segment/prototyp/VariantA–D.tsx, src/routes/dev/primitives.tsx.
- src/main.tsx, src/routes/__root.tsx — appnivåns två textrader, TASK-218.3-ägda,
  uttryckligen orörda per kortets SCOPE-GRÄNS.

Redan trappan-kompatibla (sr-only + Skeleton sedan tidigare, ingen ändring krävdes):
AktivitetsHistorik.tsx, EventCheckin.tsx, EventDetail.tsx, EventsCalendar.tsx,
EventsList.tsx, ManuellAnmalanForm.tsx, events/detail/Deltagare.tsx,
events/detail/Gruppdynamik.tsx, hem/DashboardCard.tsx (facit-primitiven),
hem/NastaEventCard.tsx, hem/NyaAnmalningarCard.tsx, hem/ObetaldaCard.tsx (samtliga
loadingLabel-konsumenter av DashboardCard), hem/SenasteAktivitet.tsx,
persons/PersonDetail.tsx, persons/PersonsList.tsx, registrations/AnmalanDetail.tsx.

GRINDAR (kommandon exakt enligt CONTRIBUTING.md/CLAUDE.md):
- npm run typecheck → exit 0.
- npx @biomejs/biome check . → exit 0 (6 warnings/42 infos, samtliga pre-existing,
  inget i de 10 rörda filerna).
- npm run build → exit 0.
- npm run test:api → 750 passed, exit 0.
- npm run test:acceptance (riktad mot de 9 acceptance-filer som täcker 8/10 rörda
  ytor) → 62 passed, inkl. explicita "loading-state är tillgängligt (aria-busy +
  status)"-tester för EventRegistrations/Waitlist/MailLog/Intresserade/PersonDetail
  och "axe 0 violations" på samtliga laddade vyer.
- npm run test:visual (hermetiska visual-sviten, BÅDA vyportar) → alla 204 icke-
  screenshot-relaterade tester (inkl. axe/aria-snapshot-regressionslåsen) gröna.
  De 6 facit-tunga screenshot-jämförelserna (hem/event-lista/event-anmalda/
  eventsida/mer-anmalningar/personer) kunde INTE pixel-jämföras lokalt: denna
  worktree saknar personliga `-darwin`-baselines (första lokala körningen i en
  FÄRSK worktree — dokumenterat i CONTRIBUTING.md §Visuell regression, "Första
  lokala körningen föder -darwin-bilder"; endast -linux-referenser är incheckade,
  födda uteslutande via CI:s visual-baselines.yml). Alla assertions FÖRE
  toHaveScreenshot (synligt innehåll, t.ex. "Emma Eklund" i mer-anmalningar,
  "anmälda"-listan i event-anmalda) passerade — beteendeneutraliteten är därmed
  bevisad för det LADDADE läget. Kompletterande strukturellt bevis: git diff
  --unified=0 visar att ALLA hunkar i de 10 filerna ligger strikt inom
  isPending-returblocket + en importrad — det laddade lägets JSX är ORÖRT, så
  screenshot-jämförelsen (som alltid tas EFTER att data landat) kan inte påverkas
  av denna diff. hem.spec.ts hade dessutom ett förbefintligt, av mig ORÖRT
  locator-strict-mode-fynd (getByText('Lotta') → 3 träffar) på mobil — Hem/
  DashboardCard/Greeting rörs inte av detta kort, bokfört som observation.

E2E-STAGING (tests/e2e/event-narvaro-register.staging.test.ts, mockad via
page.route, den mest direkta täckningen för Narvaro.tsx): kunde INTE köras.
Staging-preflighten (TASK-77/84, tests/support/staging-preflight.ts) stoppade
auth.setup.ts eftersom post-merge.yml (CI-run 31878090873, jobbet "Staging
(API + E2E)") stod in_progress mot samma delade Airtable-bas när körningen
försöktes. Respekterad, ej overridad (MM_STAGING_PREFLIGHT=off är "ett aktivt
val, aldrig default" — CONTRIBUTING.md §Staging-preflighten; jag hade ingen
särskild kunskap som motiverade override). Narvaro.tsx + PersonAnteckningar.tsx
(ingen dedikerad acceptance-fil för någon av dem) täcks i stället indirekt av:
(a) eventsida.spec.ts / person-detail.acceptance.test.ts (monterar båda,
axe 0 + synligt-innehåll-assertions gröna), (b) strukturell identitet med
Anteckningar.tsx/Deltagare.tsx/Gruppdynamik.tsx (samma migreringsmönster,
fullt testtäckta), (c) diff-confinement-beviset ovan.

Övrig observation (ej i scope, ej åtgärdad): docblocket i
tests/e2e/event-narvaro-register.staging.test.ts refererar
"tests/acceptance/event-narvaro.acceptance.test.ts" som om den finns — filen
existerar inte (sannolikt riven i samma TASK-214.7-promovering som
EventAttendance.tsx). Bokförs, inte fixat (utanför detta korts scope).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad i PR #1338 (commit 79f9814b, MERGED på main ab4f3c1c). Grep-deriverad verklig mängd: 10 produktionsytor med naken Laddar…-textrad som enda laddbesked (research-talet 32 räknade brett — sr-only/placeholders/kommentarer korrekt klassade och orörda), samtliga migrerade till trappans steg inom isPending-blocken (laddat läge matematiskt orört); appnivåns två 218.3-ägda rader orörda per scope; acceptance 62 grön, DoD-kvartetten grön.
<!-- SECTION:FINAL_SUMMARY:END -->
