---
id: TASK-260
title: 'QA-utredning: leads och namnlösa i utskickspubliken (Ej tillgängligt)'
status: Done
assignee: []
created_date: '2026-08-17 09:34'
updated_date: '2026-08-17 09:55'
labels:
  - qa-utredning
dependencies: []
ordinal: 478000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus QA-fynd 2026-08-17 (249.8, prod): segmentvalen RIM 1 + Fjärrskådning i utskicksvyn gav publik med Leads/intresserade och många 'Ej tillgängligt'-personer; följdfel i mail-förhandsvisningen ('som Ej tillgängligt får det', 'Hej Ej,'). Utredning pågår (research-pass, Opus, S104): rotorsak per hypotes (gamla segmentregler / namnlösa i basen / läsvägens fallback / membership-golvet) + antal per kategori + rekommendation bas-kontra-kod. Rapport landar i docs/research/utskickspublikens-leads-och-namnlosa-2026-08-17.md. Åtgärds-scope beslutas av Marcus när rapporten är inne (ADR-063: resolution i basen, ej designas bort).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Utredd (research-pass Opus, S104): rapport i docs/research/utskickspublikens-leads-och-namnlosa-2026-08-17.md. Domen: INGA leads i publiken (0 av 247 — troligaste förklaringen är basens Leads-VY som felaktigt visar 448/670 personer); 'Ej tillgängligt' är äkta och stort: 154/247 mottagare (62,3 %), samtliga ur backfillen 2026-04 (fälla 43); 248/670 personer i basen saknar namn. Kritisk kant bokförd på task-213.4 (BLANK()-fixen förvärrar mailvägen utan AC-utökning). Åtgärdsval ägs av Marcus.
<!-- SECTION:FINAL_SUMMARY:END -->
