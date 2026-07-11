---
id: TASK-4.5
title: 'Skiva: Osynliga uppdateringen (B3)'
status: In Progress
assignee: []
created_date: '2026-07-07 08:56'
updated_date: '2026-07-11 19:09'
labels:
  - ready-for-agent
dependencies:
  - TASK-4.3
  - TASK-4.4
parent_task_id: TASK-4
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Alla Hem-hämtningars bakgrundsuppdateringar är HELT osynliga (stale-while-revalidate): tidigare data renderas orörd under tyst omhämtning (placeholderData-mekaniken), ingen spinner, blur, dimning eller layout-rörelse någonstans på Hem; innehåll ändras ENDAST när datat faktiskt ändrats. Enda ärliga undantag: kall första-laddning visar ett lugnt laddläge. Bevis per S55 Del 11-mönstret: renderad före/under/efter-identitet med bevisat aktiv omhämtning (neutraliserad muspekare; jämför text-kanter, inte border-boxar — L246-mätfällorna). Persist-cache ingår INTE (bokförd senare förfining, PRD-beslut 10).

Täcker användarberättelser: 15, 16.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ingen visuell indikation under bevisat aktiv bakgrundsomhämtning: renderat FÖRE == UNDER == EFTER (identitetsbevis med neutraliserad pekare)
- [x] #2 Oförändrat data ger noll synlig förändring; ändrat data byter endast berörda värden utan layout-rörelse (containrar mät-stilla)
- [x] #3 Kall första-laddning visar laddläge — asserterad med robust vänte-strategi, inte fast delay (TASK-3-fyndet)
- [x] #4 Hela e2e-/axe-sviten grön
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FACIT-AVPRICKNINGEN (DoD #6, L245/L246) — varje berörd facit-/byggkravspunkt, RENDERAD verifiering (permanenta e2e-assertions i tests/e2e/hem.staging.test.ts, describe 'Osynliga uppdateringen (task-4.5)'; bevisformen = S55 Del 11-mönstret):
1. Uppdateringar HELT OSYNLIGA (facit-specen + B3): main-element-skärmdumpar FÖRE == UNDER == EFTER triggad poll-omhämtning BYTE-IDENTISKA (Buffer.equals = cmp-klassen) — AC1-testet, grönt. Omhämtningen BEVISAT aktiv i UNDER-läget: prod saknar prototypens data-proto-fetching-krok, aktivitetsbeviset är i stället NÄTVERKSNIVÅ — EF-svaren parkeras ofulfillade (håll-bar route-mock), UNDER-fasen har 2 mottagna obesvarade anrop i luften (get-registrations + get-events; registrations-queryn dedupad över sina två kort-konsumenter).
2. Ingen spinner/blur/dimning (Del 11: filter none/opacity 1): computed-style asserterad på main + alla tre kort-regionerna under aktiv omhämtning = filter 'none', opacity '1'; role=status count 0 i main — AC1-testet, grönt.
3. L246-mätfällorna respekterade: muspekaren neutraliserad (mouse.move(0,0)) före skärmdumps-jämförelsen (hover ger falsk diff); AC2 mäter containrarnas boxar (layout-stillhet), inte border-boxar som diff-kanter; relativa tider i dagsgamla former (glider inte inom testets sekunder).
4. Innehåll ändras ENDAST när datat faktiskt ändrats: data-byte mellan pollarna (Obetalda 1→2 via avgift-flip på befintlig rad, beläggning 5→6) → endast berörda värden bytta ('2', '6 av 20 platser bokade'), oberörda orörda (namnlänk, 'Utan event'), och ALLA fem containrar (main, Nästa event, Obetalda, Nya anmälningar, CTA) boundingBox-IDENTISKA före/efter — AC2-testet, grönt. Oförändrat-data-fallet bärs av AC1:s hårdare byte-identitet.
5. Kallstart-undantaget (facit + PRD-beslut 10): kall första-laddning visar lugnt laddläge — EF-svaren parkerade från start (TASK-3-fyndet: robust vänte-strategi, INGET lastkänsligt delay-fönster), 3 role=status + aria-busy med kortens laddtexter deterministiskt synliga; släpp → innehållet ersätter, 0 status kvar — AC3-testet, grönt.
6. placeholderData-mekaniken (PRD-beslut 10): placeholderData: keepPreviousData tillagd i DASHBOARD_POLLING (poll-lagret, useDashboardData.ts). ÄRLIGT BOKFÖRT i koden: med dagens statiska query-nycklar bär React Querys SWR-default + tracked-props redan osynligheten (identitetsbeviset grönt UTAN raden — se TDD-avvikelsen); optionen kodifierar facit-kontraktet i själva poll-lagret och håller osynligheten om en nyckel blir parametrisk.
7. Persist-cache ingår INTE (PRD-beslut 10): mekaniskt grep-verifierat — persistQueryClient endast som pre-existerande defer-kommentar i router.ts, inget i diffen.
8. Hela e2e-/axe-sviten grön (AC #4): kanoniska sviterna SEKVENTIELLT per TASK-6-mitigationen (aldrig blandad full-parallell): test:api 290/290, test:e2e:staging 140 passed + 2 pre-existerande villkors-skips, test:a11y 13/13; typecheck + typecheck:tests + biome (exit 0) + build gröna. TASK-5-mitigationen tillämpad: föråldrad dev-server (PID 92138, startad tidigare idag) dödad före e2e → Playwright startade färsk.

TDD-BEVIS/AVVIKELSE: bevis-skiva — alla tre testerna skrevs FÖRST och observerades GRÖNA direkt mot oförändrad produktkod (beteendet bars redan av SWR-defaulten; ingen rött→grönt-cykel möjlig för AC1–AC3). RÖD-KAPABILITET därför bevisad via inducerade defekter: (probe A) isFetching kopplad till laddläget → AC1 RÖTT (role=status 1 ≠ 0 under omhämtning); (probe B) laddläget bortkopplat → AC3 RÖTT (2 ≠ 3 status). Båda proberna återställda; sluttillstånd grönt.

Väntar design-review (S62 batch 3) · leverans c1aa713 · CI-run 29164601255 grön per jobb (Detect changed files ✓, Lint + Audit + TypeCheck ✓, Test + Build ✓, Docs link check ✓, CI Passed or Skipped ✓; attempt 1 = första passet) · facit-avprickningen i notes ovan. DoD #5 (design-review mot K10-facit) ÖPPEN — Marcus-grinden; final-summary + Done-flip sker där. Granskningsanvisning: osynligheten är GRANSKNINGSBAR DESIGN (L247) — beteendet demonstreras enklast live på /hem: låt vyn stå (60 s-pollen ska inte synas som blink/hopp/snurra), jämför mot Del 11-kvittensen; kallstartens lugna laddläge syns vid hård omladdning.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT K10-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-/byggkravspunkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
<!-- DOD:END -->
