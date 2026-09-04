---
id: TASK-176
title: 'Grind F: flippa ENVIRONMENT=production för send-email i prod + verifikat'
status: Done
assignee: []
created_date: '2026-08-10 06:14'
updated_date: '2026-08-13 14:27'
labels:
  - ready-for-human
dependencies: []
priority: high
ordinal: 333000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fail-closed-spärren i send-email avvisar allt utom exakt 'production' (422) — noll skarpa mail kan skickas förrän flippen görs. Marcus sätter secreten själv (Code rör ALDRIG nyckeln/secreten, T55). Code verifierar efteråt icke-muterande per T55:s stegsekvens.

Källor: tasks/threads/T55-mail-go-live-grind-f.md (hela tråden) · tasks/threads/T46-go-live-karta.md rad 18 ('Återstående gate till live').

Go-live-blockerare på Lotta-kan-jobba-baren (Marcus-beslut 2026-08-10, sessionsdok S102).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 ENVIRONMENT=production satt i prod för send-email — Marcus handgrepp, bokfört med tidsstämpel i kortets notes
- [x] #2 Code-verifikat efter flipp: miljö-grinden avvisar inte längre (422-klassen borta) via icke-muterande verifikatform per T55
- [x] #3 T55-tråden uppdaterad med utfallet
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
BOKFÖRINGS-RÄTTELSE 2026-08-12 (nightly-grind-drift, run 31560003797): AC #1 och #2 bockade mot belägg — sessionsdok S102 Del 6 (tasks/sessions/archive/2026-08/2026-08-10-session-102.md rad ~315-329): Marcus skapade ENVIRONMENT=production, full-paritetsdeploy #1165 (33 EF:er, deny-probes 8/8 -> 401), skarpt bevis bekräftelsemail levererat i prod (Resend f4045fde, delivered 19:17:21Z) - 422-klassen bevisat borta. AC #3 LÄMNAD OBOCKAD MED FLIT: tasks/threads/T55-mail-go-live-grind-f.md bär fortfarande Tillstånd: paused (verifierat i git log + tasks/threads/README.md-registret) - tråden är aldrig uppdaterad med utfallet trots att arbetet är gjort och dokumenterat på andra ställen (Final Summary, sessionsdok). Utanför denna rättelses mandat (ren kort-bokföring, ej trådredigering) - flaggat till orkestrerare/Marcus i stället för gissat bockad.

[S105 D3-A, 2026-08-13] DoD-STATUS PER POST (nightly-drift-rättelse, run 31664046792 — 0 AC obockade, 4 DoD obockade): #1 CHECK — alla 3 AC bär [x] (npx backlog task 176 --plain verifierat): AC#1/#2 landade via PR #1196 (merge 4b83c8a9ed9e3b92f817c757c77bd1bbc8720e37, ancestor av origin/main verifierat via git merge-base --is-ancestor), AC#3 landade via PR #1197 "T51/T55 stängda mot S102-belägg" (merge ecbbc128e3d92000b92211cc97eeaacf24086c0c, samma ancestor-verifiering). #2 CHECK — rörd fil-klass för kortets egen livscykel är docs (backlog-kort + trådfiler under tasks/threads/); npm run check:docs kört fräscht i denna session mot aktuellt main-läge: 14/14 gröna, exit 0. PR #1197s egen body bokför dessutom lokalt verifikat vid landningstillfället: "check-thread-index OK · check-lifecycle OK · check-backlog-closure exit 0". #3 CHECK — gh pr view 1196/1197 --json statusCheckRollup: samtliga required jobb SUCCESS (Lint+Audit+TypeCheck, Docs link check, CI Passed or Skipped, CodeQL), Test suite SKIPPED (korrekt D0-klassning för docs-only-diff). Ingen röd check i någotdera. #4 CHECK — PR #1196 rörde 5 backlog-kortfiler (147.10/176/177/184/186, samtliga i scope för sitt uttalade syfte: rätta nightly-drift på fem kort i samma run); PR #1197 rörde exakt task-176/task-177/tasks/threads/README.md/T51-tråden/T55-tråden — samtliga direkt relevanta för att stänga AC#3. Inga orelaterade filer i någotdera diff.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Grind F genomförd 2026-08-11 (S102): Marcus skapade ENVIRONMENT=production på lvjsfnphlauldxqlncpl (dashboard). Full-paritetsdeployen (33 EF:er, PR #1165) + deny-probes 8/8 → 401. Skarpt verifikat: bekräftelsemail genom prod-vägen levererat (Resend f4045fde, delivered 19:17:21Z) — vakten är AV i prod och sändvägen fungerar ände-till-ände.
<!-- SECTION:FINAL_SUMMARY:END -->
