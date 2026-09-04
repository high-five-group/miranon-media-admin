---
id: TASK-309.32
title: >-
  Facit-fångst av ett valt events fulla dokumentlista med dagens ikonpar-Visa —
  gapet efter s102-pensioneringen
status: To Do
assignee: []
created_date: '2026-08-26 05:12'
labels:
  - ready-for-agent
dependencies:
  - TASK-309.24
parent_task_id: TASK-309
ordinal: 598000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Gapet identifierades i docs/research/facit-pensionering-s102-2026-08-26.md § 5 (PR #1991) och var redan bokfört av skiva 9-agenten i s108-dokumentytan/facit.json:s not-fält: ingen av s102, s108-generering eller s108-dokumentytan avbildar ETT VALT EVENTS dokumentlista (alla filterlägen, alla tre dokumentklasser blandade) där en befintlig bilaga/mall/kvitto öppnas/förhandsvisas med DAGENS ikonpar-beteende (TASK-273.4 ersatte dialog-Visa). s102 pensioneras (TASK-309.29) — denna skiva stänger gapet.

GÖR: utöka s108-dokumentytan (rekommenderat i research § 5 — en tredje bilduppsättning för eventläget) eller skapa nytt manifest; avgör och bokför. Bilder desktop + 375 px per filterläge som Marcus-beslutet i TASK-309.24 definierar (låst fyraraders-höjd) — därför beroende på 309.24: ta bilderna EFTER att listhöjds-regeln landat, annars fryser facit fel form. Metod: docs/reference/prototyp-verifiering-runbook.md § Bildtagningens två fällor; staging-data via npm run seed:review (bygg ALDRIG granskningsdata för hand — CLAUDE.md § Granskningsdata) med både bekräftade och obekräftade anmälningar och minst 5 dokument så scroll-läget avbildas. Manifestet skrivs med godkand: null (kod-görbart); stämplingen är Marcus. referenser-nyckel SKA deklareras för de nya ytorna (innehållslåset, ADR-102 invariant d) — det är precis luckan TASK-309.31 handlar om.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Manifest, utökat s108-dokumentytan eller nytt, med ytan 'valt events dokumentlista' — bilder för alla filterlägen i desktop och 375 px inkl. scroll-läget med minst 5 rader, tagna med skiva 9:s metod; godkand: null
- [ ] #2 Ytan deklarerar referenser-nyckel mot de källfiler som bär formen, sha256 skrivna via repots skript — innehållslåset aktivt
- [ ] #3 check-facit.sh exit 0 och dokumentationsgrindarna exit 0; s108-dokumentytans not-fält uppdaterat så gapet inte längre beskrivs som öppet
- [ ] #4 Granskningsfixturen städad med seed:review:clean och ingen ZZ-GRANSKNING-rad kvar i staging efter passet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
