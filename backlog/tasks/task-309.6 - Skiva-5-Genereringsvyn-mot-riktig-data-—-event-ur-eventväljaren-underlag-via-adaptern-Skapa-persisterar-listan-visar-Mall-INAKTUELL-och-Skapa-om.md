---
id: TASK-309.6
title: >-
  Skiva 5: Genereringsvyn mot riktig data — event ur eventväljaren, underlag via
  adaptern, Skapa persisterar, listan visar Mall, INAKTUELL och Skapa om
status: Done
assignee: []
created_date: '2026-08-23 14:23'
updated_date: '2026-08-24 17:04'
labels:
  - ready-for-agent
dependencies:
  - TASK-309.3
  - TASK-309.4
parent_task_id: TASK-309
ordinal: 567000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lotta väljer ett riktigt event, ser och ändrar texterna, skapar bilagan och får den i dokumentlistan — och ser när den blivit föråldrad. Formen är oförändrad mot den godkända prototypen; bara datavägarna byts. Täcker användarberättelser: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 21, 31.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Genereringsvyn (fortfarande bakom variant-gaten i denna skiva) öppnas för det event eventväljaren pekar ut och fyller blocken ur skiva 1:s underlag; ARBOGA-fixturen, PLATSER_SEED och EVENTINNEHALL-konstanten rivna
- [x] #2 Block-dialogen sparar via skiva 2:s skrivvägar: kopia på eventet, 'spara som platsens standard' vid Skapa (inte vid krysset), agendan rad för rad; tomma block listas som utelämnade
- [x] #3 Förhandsgranska först anropar preview-grenen; Skapa anropar persisterande grenen, öppnar filen i ny flik (blockerat fönster → 'Öppna'-knappen står kvar), dubbelklicksskyddet (aria-disabled + vakt) behålls; listan invalideras och raden syns direkt
- [x] #4 Dokumentlistan visar Mall för Event-mallade rader, INAKTUELL-markering när adaptern härleder hash-avvikelse, och Skapa om som anropar ersatt-läget och behåller samma rad; aldrig någon automatisk regenerering
- [x] #5 Adaptern härleder inaktualitet (dagens hash ≠ Källhash) i listningen för båda adaptrarna; staging-test och acceptance-test: skapa → ändra block → INAKTUELL → skapa om → samma rad, aktuell
- [x] #6 Klienten skickar eventId + mall + ev. ersatt — ingen HTML, ingen mallhämtning; sjalvbarande.ts och /docs/mallar-fetchen rivna ur klienten
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [x] #6 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Skiva 5 kopplade genereringsvyn till riktig data. Vyn öppnas för det event eventväljaren pekar ut och fyller blocken ur skiva 1:s underlag; block-dialogen sparar via skiva 2:s skrivvägar (kopia på eventet, "spara som platsens standard" vid Skapa men inte vid krysset, agendan rad för rad, tomma block listade som utelämnade). Förhandsgranska anropar preview-grenen, Skapa anropar persisterande grenen och öppnar filen i ny flik med kvarstående Öppna-knapp vid blockerat fönster; dubbelklicksskyddet (aria-disabled plus vakt) behållet. Dokumentlistan visar Mall för Event-mallade rader, INAKTUELL när adaptern härleder hash-avvikelse, och Skapa om mot ersatt-läget som behåller samma rad — aldrig någon automatisk regenerering. Inaktualiteten härleds i BÅDA adaptrarna.

BARS AV: PR #1885, commit 5632e164 (MERGED 2026-08-23T19:38Z, 17 filer).
GRIND-UTFALL: 12 CheckRuns SUCCESS + 3 SKIPPED på exakt 5632e164 — noll icke-gröna. Landad via merge-kön.

AC #1 och #6:s rivningar verifierade mot origin/main 2026-08-24: ARBOGA-fixturen, PLATSER_SEED och EVENTINNEHALL-konstanten är borta, och klientens självbärande-modul samt /docs/mallar-fetchen är rivna — `find src -name "sjalvbarande*"` ger noll träffar och `grep -rn "docs/mallar" src/` ger noll träffar. Klienten skickar eventId, mall och eventuellt ersatt; ingen HTML, ingen mallhämtning.

DoD-belägg: #3 bockad 2026-08-24 mot check-rollupen ovan. Punkterna #1, #2, #4, #5 och #6 var redan bockade av bygg-agenten; #6 dessutom oberoende ommätt 2026-08-24 — lagervakten `tests/api/attachment-layer-independence.test.ts` 7/7 gröna, exit 0, inklusive tvåvägsbevis (detektorn fäller på konstruerad överträdelse, släpper igenom oskyldig text).

Stängd av orkestrerad stängningsagent 2026-08-24 mot post-merge-bevis.
<!-- SECTION:FINAL_SUMMARY:END -->
