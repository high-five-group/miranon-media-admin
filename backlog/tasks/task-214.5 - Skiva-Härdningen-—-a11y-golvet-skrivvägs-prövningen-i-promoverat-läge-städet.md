---
id: TASK-214.5
title: >-
  Skiva: Härdningen — a11y-golvet, skrivvägs-prövningen i promoverat läge,
  städet
status: To Do
assignee: []
created_date: '2026-08-14 19:18'
labels:
  - ready-for-agent
dependencies:
  - TASK-214.4
parent_task_id: TASK-214
ordinal: 406000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Den promoverade ytan härdas till skarp standard: tillgänglighetsgolvet bevisas med axe, skrivvägarna re-prövas i det promoverade läget, och prototypens byggspår städas utan att formen rörs. Täcker användarberättelser: 9, 10
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Axe-pass utan serious eller critical på dörrlistan i promoverat läge — a11y-golvet 11 håller (prefers-contrast, prefers-reduced-motion, print inkluderat)
- [ ] #2 Skrivvägarna prövade i promoverat läge: incheckning, ångra båda riktningarna, CREATE-fallback och felvägen — mutations-skivans beteende-AC håller efter flippen
- [ ] #3 Prototyp-städ utfört: döda variant-referenser städade; designskäl-kommentarer behållna
- [ ] #4 Dörrlistan fortsatt identisk med facit tasks/sessions/bilagor/s103-checkin-konvergens/facit.json ytan 'check-in (dörrlistan, variant D)'
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter)
- [ ] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
- [ ] #7 Datavägs-invarianten verifierad: läsvägen oförändrad; skrivning sker ENDAST via de två speccade operationerna
- [ ] #8 Test-konsument-svepets träffyta bilagd och alla träffar uppdaterade i samma skiva som sin flip
- [ ] #9 Kvittensfönstrets kontrakt bevisat via nätverks-observation: inget skrivanrop före fönstrets utgång, ångra ger noll anrop
- [ ] #10 Facit-granskningen utförd mot tasks/sessions/bilagor/s103-checkin-konvergens/facit.json (ytan 'check-in (dörrlistan, variant D)')
<!-- DOD:END -->
