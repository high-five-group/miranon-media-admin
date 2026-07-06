---
id: TASK-1.2
title: 'Skiva: Tabbaren till FK-mönstret'
status: Done
assignee: []
created_date: '2026-07-05 21:08'
updated_date: '2026-07-06 14:27'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-1
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Huvudnavigationens tabbar (delat app-skal — alla vyer ärver uppgraderingen) lyfts till FK-mönstret: ikon + etikett per flik (Hem/Event/Personer/Mer; ikonval följer flikarnas domänbegrepp) och tydlig markering av aktiv flik, aldrig enbart via färg (PRD implementationsbeslut 8). Nya tokens endast i semantik-/komponentlagret (beslut 2). Berörda befintliga assertions (skalets navigation) uppdateras i SAMMA skiva som ändringen; ingen annan vys axe-baseline får fällas — förebild: shell-e2e:n.
Täcker användarberättelser: 12 (+ 13, 14, 15 för tabbarens del)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Varje flik visar ikon + etikett; aktiv flik markeras tydligt med mer än enbart färg (aria-current='page' kvarstår)
- [x] #2 Tabbaren är fullt tangentbordsnavigerbar och klarar prefers-contrast: more samt prefers-reduced-motion
- [x] #3 Shell-e2e:n grön med uppdaterade assertions i samma skiva; samtliga befintliga vyers axe-baselines fortsatt 0
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit 32776d2 + c0016a4 (design-review-looparna 2+3) · CI-run grön per jobb på båda (första-pass ja/ja) · CI-grön-första-pass: ja · defekter under körning: 0 (person-detail-loading-fallet stash-belagt pre-existing → TASK-3 tredje fil-instansen) · TDD: 1 cykel (ikon-assertionen rött→grönt) + 3 granskningsloopar (L220: flytande kapsel; skugga bort + bred pill; grå betonings-pill via NY semantisk token --mm-bg-emphasized). Design-review godkänd (Marcus 2026-07-06). DRIFT-METRIK-MATNING 5 (ADR-068 p.8-minimiformen).
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review: Marcus-granskning i webbläsaren godkänd
<!-- DOD:END -->
