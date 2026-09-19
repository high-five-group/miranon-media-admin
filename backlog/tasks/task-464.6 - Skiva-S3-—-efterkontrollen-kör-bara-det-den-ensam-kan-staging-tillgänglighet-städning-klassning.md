---
id: TASK-464.6
title: >-
  Skiva: S3 — efterkontrollen kör bara det den ensam kan (staging,
  tillgänglighet, städning, klassning)
status: Done
assignee: []
created_date: '2026-09-19 10:48'
updated_date: '2026-09-19 16:36'
labels:
  - ready-for-agent
dependencies:
  - TASK-464.3
parent_task_id: TASK-464
priority: high
ordinal: 822000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Post-merge kör i dag hela den hermetiska sviten en FJÄRDE gång plus 'Staging (API + E2E)' mot den verkliga staging-basen (mätt: 57 fakturerade min på #2556, körning 35432195230). Bara staging-delen, a11y, sentinel-städningen, klassningen och exponeringsfönstret är unika. Ta bort den fjärde hermetiska körningen ur post-merge.yml; researchens härledda mål är ca 24 fakturerade min. Skyddsförlusten är liten men inte noll — efterkontrollen är enda ytan som kör på det faktiskt landade trädet efter en gruppmerge; N3 (TASK-450.2, landad e6308887) klassar redan hela det pushade spannet och är förutsättningen. RÖR INTE frågan per-landning-kontra-klocka: den väntar på research-passet docs/research/efterkontroll-pa-klocka-2026-09-19.md och Marcus beslut. Larmkedjan (ci-post-merge-ärenden, revert-förslag) ska fungera oförändrat. Källa för besluten: tasks/sessions/2026-09-17-session-126.md Del 17 (grillad samsyn, Marcus kvittens 2026-09-19) + Del 11 (ledstjärnan). Underlag: docs/research/actions-minutbudget-2026-09-18.md. Varje faktapåstående här är en HYPOTES tills du prövat den mot disk (ADR-086). Täcker användarberättelser: 1, 2, 3.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Kontrastpar med run-ID: efterkontrollen på en kodlandning kör staging + a11y + städning men INGEN hermetisk acceptance-körning; fakturerade minuter före/efter redovisade per jobb
- [x] #2 Post-merge-larmet (ärende + klassning av hela spannet) fungerar oförändrat — bevisat med workflowens självtest (simulate_failure) eller befintlig gatekeeper-svit
- [x] #3 En dokumentlandning ger fortfarande en efterkontroll som hoppar sviten (som #2572: 2 fakturerade min)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [x] #4 PR-kroppen bär sektionen 'Kostnad i två mått': VÄNTETID och FAKTURERADE MINUTER sida vid sida, mätta körningar med run-ID, enheter utskrivna, månadseffekt vid 1 279 landningar
- [x] #5 Inget nytt JOBB där ett steg i ett befintligt jobb räcker (varje jobb avrundas upp till hel minut, gånger ytorna)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
RÄTTELSE AV KORTETS EGEN BESKRIVNING (S126, 2026-09-19): meningen 'efterkontrollen är enda ytan som kör på det faktiskt landade trädet efter en gruppmerge' är FALSK och står kvar ovan endast som historik. Mätt mot grupplandningen 811cece3 (#2588 + #2596): kö-körningen 35448948271 och push-körningen 35449264286 körde båda hela sviten grön på exakt den landade SHA:n — kön ser gruppinteraktionen. Felet var orkestrerarens formulering vid nedbrytningen; rättat i post-merge.yml:s filhuvud, CONTRIBUTING § Post-merge-lagret (denna PR) och ADR-133 beslut 6 + § Updates (#2600). Fynd ur PR #2597 review runda 1 (risk hög) och runda 2.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landad som PR #2597 → 51d5d762 (2026-09-19 16:17Z). Två rundor: r1 risk HÖG på en falsk premiss i motiveringen (koden rätt, alla AC höll); Marcus: 'Vi kör på dina rekommendationer' → texten rättad, r2 risk medel, armerad på Marcus mandat ('anser du att det är GO så är det GO'). Mekanik: ny workflow_call-input run_hermetic_suite (default true) i ci-suite.yml; post-merge.yml skickar false; ci.yml och nightly.yml oförändrade. FÖRSTA SKARPA EFTERKONTROLLEN (35454478001 på 51d5d762): success — klassning 8 s, sentinel-städning 64 s + 24 s, a11y 172 s, Staging (API + E2E) 961 s, exponeringsfönster 4 s; Pure + Build, Acceptance ×3, tvåsidigt bevis ×3, täckning och Webblasarbeteende skipped. Fakturerat ≈ 25 min (varje jobb avrundat uppåt: 1+2+3+17+1+1) mot 57 före (#2556, 35432195230) och 24 i provkörningen (35448234177). Kvar för TASK-464.5: ci.yml:s SKYDDSNÄTET-kommentar (AC #9 där).
<!-- SECTION:FINAL_SUMMARY:END -->
