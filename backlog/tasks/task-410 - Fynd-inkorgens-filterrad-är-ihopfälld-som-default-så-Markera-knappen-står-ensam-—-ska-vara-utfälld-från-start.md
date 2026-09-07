---
id: TASK-410
title: >-
  Fynd: inkorgens filterrad är ihopfälld som default så Markera-knappen står
  ensam — ska vara utfälld från start
status: Done
assignee: []
created_date: '2026-09-06 09:11'
updated_date: '2026-09-07 15:52'
labels:
  - ready-for-agent
dependencies: []
ordinal: 711000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus prod-granskning 2026-09-06 (S121 resume 4, QA-vandringen TASK-402.7 påbörjad i prod): när filterraden i betalningsinkorgen är ihopfälld står Markera-knappen ensam på raden och ser fel ut; utfälld ser raden rätt ut. Marcus: filterraden ska vara utfälld som default. Fakta: FilterRad är en primitiv (src/components/primitives/FilterRad.tsx) med internt state const [oppen, setOppen] = useState(false) på rad 222, ingen defaultOppen-/isOpen-prop i FilterRadProps (rad 58–86) och ingen persistens; inkorgen anropar den från src/components/betalningar/BetalningsInkorg.tsx:1603 med sökfältet i children. Förväntat: en explicit prop (t.ex. defaultOppen) på primitiven, satt av inkorgen, så andra konsumenter av FilterRad behåller sitt beteende; ingen global default-ändring. Inkorgen har inget facit-lås (inget facit.json för ytan), så ingen AMENDERING krävs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Betalningsinkorgens filterrad renderas utfälld vid första besöket utan att användaren tryckt på tratt-knappen; Dölj filter fungerar som förut
- [x] #2 FilterRad-primitiven bär en prop för start-läget; övriga konsumenter av FilterRad är oförändrade (grep på FilterRad-anrop bokförd i kortet)
- [x] #3 Befintliga acceptans-/e2e-tester för inkorgen gröna; ett test täcker start-läget
- [x] #4 Avståndet mellan Markera-knappens rad och filterkomponenten är 40 px (var 16 px, sektionens gap-4; ett första varv gav 24 px men räckte inte i granskning) — Marcus två varv 2026-09-06: "lägg mer luft mellan markera-knappen och filtreringskomponenten också" följt av "Jag vill ha mer luft ÖVER markera knappen, luften under är bra som det är nu." Luften UNDER (mot listan) är oförändrad 16 px.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FilterRad-konsumenter (grep 2026-09-06, S121): src/components/betalningar/BetalningsInkorg.tsx:1603 (fick defaultOppen), src/components/aktivitetshistorik/AktivitetsHistorik.tsx:817 (oförändrad, ingen defaultOppen), src/components/events/EventsList.tsx:279 (oförändrad), src/components/registrations/AnmalningarSida.tsx:744 (oförändrad). Lösning: FilterRadProps fick en ny valfri prop defaultOppen (default false, oförändrat beteende), läst av useState vid mount. BetalningsInkorg.tsx är enda konsumenten som sätter defaultOppen (utan värde = true). Test: tests/e2e/betalningar-inkorg-markera-lage.staging.test.ts fick ett nytt describe TASK-410 som verifierar start-läget öppet + att toggling fortfarande fungerar; samma fils befintliga test som klickade 'Visa filter' för att nå panelen justerades (panelen är redan öppen nu).

FINAL SUMMARY (S121 resume 4, 2026-09-06): byggd AFK av bygg-agent (Sonnet 5) i egen worktree; två varv på Marcus granskning på granskningsservern 4173 (luft 16→24 px, sedan 40 px ovanför Markera-knappen, luften under oförändrad). Granskning runda 1: risk låg, 1 info (kommentarsterminologi), 0 blockerande — konvergerad. Marcus godkännande 2026-09-06 verbatim: 'Betalnings/inkorgs-sidan är bra nu. Nu måste den till prod så snabbt och bra som möjligt.' Landad via merge-kön PR #2379 → main 29a3c16d (2026-09-06 12:19 UTC). Post-merge CI på 29a3c16d: run 34032774066, conclusion success (läst 2026-09-06 via gh run list). DoD #2 (rörd fil-klass grindar) och #3 (path-scopad add) håller enligt PR-kroppen och granskningen; DoD #1 = alla AC bockade.

TASK-425: DoD bockad mot belägg — samtliga AC #1-#4 redan avbockade. Final Summary dokumenterar landning via merge-kön PR #2379 → main 29a3c16d (2026-09-06 12:19 UTC); post-merge CI run 34032774066 conclusion success; verbatim i kortet: 'DoD #2 ... och #3 ... håller enligt PR-kroppen och granskningen; DoD #1 = alla AC bockade'.
<!-- SECTION:NOTES:END -->
