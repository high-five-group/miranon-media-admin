---
id: TASK-451.2
title: >-
  Skiva: startvärmningens räknare skiljer lyckade från misslyckade, och 'klar
  utan data' rapporteras
status: Done
assignee: []
created_date: '2026-09-18 10:38'
updated_date: '2026-09-19 12:39'
labels:
  - ready-for-agent
dependencies: []
references:
  - docs/research/kallstarten-diagnoskarta-2026-09-18.md
parent_task_id: TASK-451
priority: high
ordinal: 786000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`klara` ökar i `.finally()` (`startvarmningen.ts:414–417`) — alltså även när ett item kastar. `avgorMed('klar')` avgörs oavsett om något cachats (`448–456`), och Sentry rapporterar ENBART vid `utfall === 'timeout' && klara < totalt` (`436–442`). En startvärmning där alla sju fallerar ser därför ut som 7 av 7, baren når 100 %, och observability tiger. Inte orsaken till 2026-09-18-händelsen (den var timeout, Sentry-belagd) men en sann blind fläck.

Underlag § 1.4, § 2.3, § 5.3 scenario B, § 6 punkt 2–3.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Rött-först: scenario B (alla sju EF svarar 500) — i dag klara = totalt och noll Sentry-anrop; testet fäller det, grönt efter fix
- [x] #2 Förloppet bär lyckade och misslyckade var för sig; barens procent bygger på avslutade (så den når slutet) men utfallet skiljer 'klar med data' från 'klar utan/med delvis data'
- [x] #3 Sentry får en varning med egen tagg när startvärmningen avslutas med minst ett misslyckat item, med antal och item-namn i extra (inga personuppgifter)
- [x] #4 ADR-112 amenderas (§ Updates) med vad räknaren faktiskt betyder; ORDLISTA-posten för Förberedelseskärmen stämmer med koden
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landat: PR #2534, merge c6983588 (2026-09-18T11:43:34Z, main). StartvarmningForlopp skiljer nu lyckade/misslyckade; nytt utfall klar-ofullstandig; ny Sentry-varning (tagg delvis-fel) vid minst en misslyckad hamtning; ADR-112 par Updates + ORDLISTA-posten for Forberedelsekarmen preciserade. Rott-forst: scenario B (7/7 EF svarar 500) falld pa main, gron efter fix. Grindar (matt): typecheck exit 0; tests/api/startvarmningen.test.ts 12/12 (api-pure); test:api bredare 1790 grona (api-staging/api-setup blockerad av samtidig CI-korning, orort av diffen); biome (5 rorda filer) exit 0; build exit 0; check-langa-streck exit 0 (328 filer); check:docs 14/14. Granskning: risk LAG, runda 1, 2 info-fynd (auto-fix-klass, ingen atgard kravd).
<!-- SECTION:FINAL_SUMMARY:END -->
