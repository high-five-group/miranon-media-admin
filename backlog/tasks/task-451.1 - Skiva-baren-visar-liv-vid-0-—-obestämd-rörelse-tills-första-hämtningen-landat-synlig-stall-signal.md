---
id: TASK-451.1
title: >-
  Skiva: baren visar liv vid 0 % — obestämd rörelse tills första hämtningen
  landat, synlig stall-signal
status: To Do
assignee: []
created_date: '2026-09-18 10:38'
updated_date: '2026-09-18 11:24'
labels:
  - ready-for-agent
dependencies: []
references:
  - docs/research/kallstarten-diagnoskarta-2026-09-18.md
parent_task_id: TASK-451
priority: high
ordinal: 785000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Förberedelseskärmens bar är `width: 0%` under hela auth-fasen (`main.tsx:439`, `FORBEREDELSESKARM_VANTAR` = 0/1) och tills första av sju hämtningar settlar (`startvarmningen.ts:414–417`). Stall-signalen (3 s) lägger puls på en nollbred div (`Forberedelseskarm.tsx:382/385`) och text i sr-only (`405`, `410`). En seende användare ser ingenting röra sig — exakt vad Marcus såg.

Golv: en determinate bar utan känt värde degraderar till OBESTÄMD (Material Design 3 Progress indicators; W3C APG: progressbar utan `aria-valuenow`). Marcus beslut i task-273.6 står kvar: skärmen bär ENBART baren, ingen synlig text läggs tillbaka — rörelsen ska bo i baren själv. Research före design: React Aria ProgressBar `isIndeterminate`.

Underlag § 1.4–1.5, § 5.4 (S1-assertionen), § 6 punkt 1.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Rött-först: acceptance-test (hermetisk MSW, fördröjd batch 1 enligt underlaget § 5.3 scenario A och seg token-refresh scenario C) samplar barens synliga tillstånd; rött på main, grönt efter fix — beviset i PR-kroppen
- [x] #2 Från att skärmen blir synlig tills första hämtningen settlat visar baren obestämd rörelse; därefter determinate X av N som i dag
- [x] #3 Obestämt läge: ingen aria-valuenow, skärmläsarbeskedet oförändrat begripligt; prefers-reduced-motion ger en icke-animerad men synlig form; prefers-contrast: more klarar kontrast
- [x] #4 Ingen ny synlig text på skärmen (task-273.6 står kvar); befintliga a11y- och höjdkedje-tester gröna
- [ ] #5 Marcus ögonmäter formen i dev-server innan Done (tillgänglighet 11, vy-ribban)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
