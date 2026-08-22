---
id: TASK-285.9
title: >-
  Skiva: Härdning — axe på alla ytor, kontrastläge, reduced-motion,
  test-konsument-svepet över familjen
status: Done
assignee: []
created_date: '2026-08-21 11:15'
updated_date: '2026-08-22 08:24'
labels:
  - ready-for-agent
dependencies:
  - TASK-285.1
  - TASK-285.2
  - TASK-285.3
  - TASK-285.5
  - TASK-285.6
  - TASK-285.7
  - TASK-285.8
parent_task_id: TASK-285
ordinal: 524000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ÄNDE TILL ÄNDE: hela familjen håller 11-golvet mekaniskt bevisat: axe-sviten ger noll violations på uppdateringsnotisen, offline-beskedet, chunk-bannern, meddelanderutan i alla intents med och utan knapprad/kryss, sektionsfelet och appfel-fallbacken. Högkontrastläge tänder kontur i intent-färg på varje ruta (emulerat och verifierat med skärmdump). Reduced-motion ändrar ingenting eftersom inget animeras (verifierat: inga transitions/animationer på familjens element). Tangentbord: notisens knappar nås inom ett fåtal tabbsteg från sidans början, fokusringen syns. Print döljer notiser. Ett samlat test-konsument-svep över hela familjen (grep över testkatalogerna efter varje berörd testid, roll och sträng) visar att inga kvarvarande konsumenter läser den gamla formen.

Visual-baslinjen för de nya ytorna FÖRBEREDS (spec-filer och fixturer) men tas INTE här — den tas som regressionslås först efter Marcus godkännande (ADR-103 B4), i rivnings-skivan. Hittas ett fynd som inte kan stängas här: NYTT kort med exakt symptom, aldrig en retuschering av denna skiva.

Täcker användarberättelser: 16, 17, 18, 22
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 axe-sviten täcker varje yta i familjen (notis, offline, chunk-banner, meddelanderutan alla intents, sektionsfel, appfel) med noll violations
- [x] #2 prefers-contrast: more ger kontur i full intent-färg på varje ruta — skärmdumpar per yta bilagda
- [x] #3 Inga transitions eller animationer på familjens element (mätt med getAnimations och computed transition i testmiljön)
- [x] #4 Notisens knappar nås via tangentbord inom högst fem tabbsteg från dokumentets början på /hem; fokusringen syns
- [x] #5 Test-konsument-svepet över hela familjen är bilagt och visar noll kvarvarande läsare av gamla testid:n, roller eller strängar
- [x] #6 Visual-spec-filer för notis, offline och chunk-banner finns men baslinjen är INTE tagen (ingen ny bild under visual-snapshots)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Facit-granskning gjord mot manifesten tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json och tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json (sökvägarna utskrivna i PR:en) — aldrig mot minne eller bildkatalog
- [x] #6 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter), ADR-103 B4
- [x] #7 Test-konsument-svepets träffyta bilagd (grep-svep över testfiler som konsumerar ytan) och alla träffar uppdaterade i samma skiva som sin flip
- [x] #8 Inga nya design-tokens uppfunna; inga hårdkodade färger utanför appfel-sidan (vars inline-form är designvillkoret)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
STÄNGNINGSPASS (register-only, 2026-08-22): PR #1732 (merge-SHA 139ae83e), CI grön per jobb (gh pr checks 1732 — samtliga pass/förväntat skip). DoD #1-#2,#4-#8 var redan bockade av byggagenten. DoD #4 dubbelkollad mot gh pr diff --name-only (13 filer: skärmdumpar + a11y/visual/webblasarbeteende-tester — samtliga i scope).
<!-- SECTION:NOTES:END -->
