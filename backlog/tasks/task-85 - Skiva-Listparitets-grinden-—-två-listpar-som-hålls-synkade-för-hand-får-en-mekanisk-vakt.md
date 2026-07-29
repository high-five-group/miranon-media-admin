---
id: TASK-85
title: >-
  Skiva: Listparitets-grinden — två listpar som hålls synkade för hand får en
  mekanisk vakt
status: To Do
assignee: []
created_date: '2026-07-29 17:35'
labels:
  - ready-for-agent
dependencies: []
ordinal: 165000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Repot har TVÅ listpar som måste hållas i synk för hand, och båda har redan driftat.

**Par 1 — allowlist/klassning:** listorna som styr CI:s filklassning står på mer än ett ställe och synkas manuellt.

**Par 2 — lychee-globarna:** samma glob-lista står i BÅDA `.github/workflows/ci.yml` och `scripts/check-docs.sh`. ADR-081:s landning ökade duplikationen med en rad (`tasks/lessons.d/*.md`).

Domen från verktygsvals-prövningen var LAGA, inte lev-med. Formen är känd: ~20 rader skript plus en policy-fil, per husets config-driven-konvention (Lesson #6) — skriptets logik universell, värdena projektspecifika.

**Öppen fråga som skivan måste stänga:** `PARITY_PATHS` är inte härledd ännu. Vilka listpar som ska vaktas är en del av arbetet, inte en förutsättning.

Källa: restlistans § A3, posten "Listparitets-grinden (dom: LAGA)". Utvidgad räckvidd 2026-07-27.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 PARITY_PATHS är HÄRLEDD ur faktiska filer, inte antagen — redovisa hur listparen hittades och varför just de
- [ ] #2 Grinden täcker BÅDA listparen, inte bara lychee-globarna
- [ ] #3 Tvåsidigt bevis: grinden är GRÖN mot nuvarande träd, och RÖD mot ett träd där ett listpar medvetet desynkats
- [ ] #4 Config-driven per Lesson #6 — logiken i skriptet, värdena i .<grind>-policy.conf; skriptet ska kunna dupliceras till annat spoke utan refactor
- [ ] #5 Fail-closed: kan grinden inte läsa ett listpar är det exit≠0, aldrig tyst grönt
- [ ] #6 Wirad i CI, eller så är skälet till att den inte är det utskrivet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
