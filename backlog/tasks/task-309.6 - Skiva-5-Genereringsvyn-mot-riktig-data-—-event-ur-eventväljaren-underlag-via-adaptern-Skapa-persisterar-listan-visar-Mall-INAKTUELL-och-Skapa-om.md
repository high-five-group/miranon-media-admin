---
id: TASK-309.6
title: >-
  Skiva 5: Genereringsvyn mot riktig data — event ur eventväljaren, underlag via
  adaptern, Skapa persisterar, listan visar Mall, INAKTUELL och Skapa om
status: To Do
assignee: []
created_date: '2026-08-23 14:23'
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
- [ ] #1 Genereringsvyn (fortfarande bakom variant-gaten i denna skiva) öppnas för det event eventväljaren pekar ut och fyller blocken ur skiva 1:s underlag; ARBOGA-fixturen, PLATSER_SEED och EVENTINNEHALL-konstanten rivna
- [ ] #2 Block-dialogen sparar via skiva 2:s skrivvägar: kopia på eventet, 'spara som platsens standard' vid Skapa (inte vid krysset), agendan rad för rad; tomma block listas som utelämnade
- [ ] #3 Förhandsgranska först anropar preview-grenen; Skapa anropar persisterande grenen, öppnar filen i ny flik (blockerat fönster → 'Öppna'-knappen står kvar), dubbelklicksskyddet (aria-disabled + vakt) behålls; listan invalideras och raden syns direkt
- [ ] #4 Dokumentlistan visar Mall för Event-mallade rader, INAKTUELL-markering när adaptern härleder hash-avvikelse, och Skapa om som anropar ersatt-läget och behåller samma rad; aldrig någon automatisk regenerering
- [ ] #5 Adaptern härleder inaktualitet (dagens hash ≠ Källhash) i listningen för båda adaptrarna; staging-test och acceptance-test: skapa → ändra block → INAKTUELL → skapa om → samma rad, aktuell
- [ ] #6 Klienten skickar eventId + mall + ev. ersatt — ingen HTML, ingen mallhämtning; sjalvbarande.ts och /docs/mallar-fetchen rivna ur klienten
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #6 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön
<!-- DOD:END -->
