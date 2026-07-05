---
id: TASK-1.2
title: 'Skiva: Tabbaren till FK-mönstret'
status: To Do
assignee: []
created_date: '2026-07-05 21:08'
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
- [ ] #1 Varje flik visar ikon + etikett; aktiv flik markeras tydligt med mer än enbart färg (aria-current='page' kvarstår)
- [ ] #2 Tabbaren är fullt tangentbordsnavigerbar och klarar prefers-contrast: more samt prefers-reduced-motion
- [ ] #3 Shell-e2e:n grön med uppdaterade assertions i samma skiva; samtliga befintliga vyers axe-baselines fortsatt 0
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review: Marcus-granskning i webbläsaren godkänd
<!-- DOD:END -->
