---
id: TASK-85
title: >-
  Skiva: Listparitets-grinden — två listpar som hålls synkade för hand får en
  mekanisk vakt
status: To Do
assignee: []
created_date: '2026-07-29 17:35'
updated_date: '2026-07-30 19:32'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TREDJE LISTPARET FUNNET 2026-07-30 (S91 artonde resumen, ur TASK-87:s agentrapport) — kandidat, ej beslutad scope-utvidgning.

CONTRIBUTING.md rad 76-78 räknar upp sentinel-markörerna som .purge-staging-policy.json äger. Listan är ofullständig: den saknar ZZ-note-test+ sedan tidigare, och saknar nu app-segment-test+ som TASK-87 lade till. Två omissioner har alltså ackumulerat utan att någon mekanism sett dem.

Formen är exakt kortets: en invariant som står på två ställen och synkas för hand. Skillnaden mot par 1 och 2 är att CONTRIBUTING-listan är EXEMPLIFIERANDE och pekar på policyn som sanningskälla — det kan vara ett skäl att lämna den utanför PARITY_PATHS, eller ett skäl att kräva att den är komplett. Den avvägningen hör till AC #1, som redan kräver att paren HÄRLEDS ur faktiska filer och att förkastade kandidater bär sina skäl.

Noteras här i stället för att mintas som eget kort, eftersom AC #1 redan äger frågan. Bygg-agenten avgör — men ska redovisa utfallet även om domen blir att paret lämnas utanför.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
