---
id: TASK-142
title: >-
  Fynd: verify-ci-parity.mjs kör alltid hela grinduppsättningen — ingen
  diff-klassning
status: Done
assignee: []
created_date: '2026-08-05 07:02'
updated_date: '2026-08-07 11:14'
labels: []
dependencies: []
ordinal: 227000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt 2026-08-05 (S98): en commit som lade till EN markdown-fil drog en full verify:ci-parity-körning på 641,0 s (28 gröna grindar, 153 acceptance-tester, 11 Playwright-tester). CI självt hoppar allt det på en docs-only-diff (ci.yml:s changed-jobb, should_skip_tests). Skriptet konsumerar ingen av changed-jobbets klassnings-outputs — grep -niE 'docs-only|D0|D1|changed|klassning' scripts/verify-ci-parity.mjs gav 3 träffar, samtliga i prosa. Fixen härleder en docs-only-klassning ur ci.yml:s changed-jobb (D0-glob på changed-files-steget) i stället för att duplicera glob-listan, och skippar test-fast/acceptance/webblasarbeteende när diffen (mot origin/main, inkl. otrackade filer) är en ren docs-diff. Fail-closed till fullt läge vid all osäkerhet. --full tvingar fullt läge.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Skriptet läser D0-glob strukturellt ur ci.yml:s changed-jobb (changed-files-steget), aldrig en handkopierad lista i policyn
- [x] #2 En ren docs-diff skippar test-fast/acceptance/webblasarbeteende (tvåsidigt bevisat, sandlåda)
- [x] #3 En src/-diff kör allt (tvåsidigt bevisat, sandlåda)
- [x] #4 En blandad diff (docs+kod) kör allt — allowlist, aldrig blocklist (sandlåda)
- [x] #5 Oläsbar/okänd D0-struktur eller trasig git-diff-beräkning faller tillbaka till fullt läge (sandlåda)
- [x] #6 Strukturell koppling (suite-jobbets if mot should_skip_tests) vaktas i paritets-preflighten — drift ger EXIT_PARITY_BROKEN
- [x] #7 --full tvingar fullt läge oavsett diff; --fast oförändrad
- [x] #8 Faktisk väggklocka mätt före/efter för en docs-only-diff
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Stängd retroaktivt 2026-08-07 (TASK-151, opportunistiskt fynd under Del 2-triagen, EJ del av #844:s drift-lista): arbetet landade 2026-08-05 (PR #762) men AC-rutorna bockades aldrig, så statusflippen till Done uteblev. Till skillnad från TASK-136 (som nattgrinden FÅNGADE) är detta mönster osynligt för check-backlog-closure.sh eftersom grindens invariant 1 kräver AVBOCKADE AC för att flagga — obockade AC på klart arbete ger ingen signal alls. Värt att notera som en lucka i grinden själv (ej åtgärdad här, utanför scope).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
verify-ci-parity.mjs klassar diffen (D0-glob härledd ur ci.yml:s changed-jobb, fail-closed, --full/--fast/--list) — landat via PR #762 (commit de7d5637), mergad till main 2026-08-05T08:03:53Z, verifierat ancestor av origin/main. Samtliga 8 AC verifierade mot faktisk källkod i scripts/verify-ci-parity.mjs (parseraD0Glob, klassificeraDiff, strukturell kopplingsvakt EXIT_PARITY_BROKEN, fail-closed-grenar, --full-tvång) samt mot CLAUDE.md:s dokumenterade mätning (kod-diff 910,7 s · docs-only-diff 332,7 s · check:docs 172 s · CI 401,0 s). CI grön per jobb på PR:en. Upptäckt OPPORTUNISTISKT under TASK-151:s etikett-triage (Del 2) — kortet stod kvar To Do med samtliga AC-boxar OBOCKADE trots landat+CI-grönt arbete, vilket förklarar varför nattgrindens check-backlog-closure.sh (invariant 1: alla AC bockade men status To Do) aldrig kunde flagga det — en strukturellt osynlig variant av samma symptomklass som TASK-136. Ej del av #844:s utpekade lista; stängt separat och bokfört öppet i TASK-151:s slutrapport.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
