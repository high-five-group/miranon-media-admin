---
id: TASK-309.2
title: >-
  Skiva 1: Datamodellen i staging — Eventinnehåll, Agendapunkter, Platser,
  (bilagetext)-fält, Mall/Källhash — plus läsvägen
status: To Do
assignee: []
created_date: '2026-08-23 13:58'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 563000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Den struktur som gör att genereringsvyn kan läsa riktiga texter: standardtexter per Event × Eventtyp, platsernas uppgifter och eventets egna kopior bor i basen, läsbara i Airtable utan app. Efter skivan kan en EF svara med exakt det underlag en bilaga fylls från, för vilket event som helst i staging. Täcker användarberättelser: 1, 2, 18, 19, 20, 29, 31.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ett Meta-API-skript (staging-låst, samma lås-mönster som create-bilagor-table) skapar tabellerna Eventinnehåll, Agendapunkter, Platser och fälten på Eventplanering (Plats-länk + 17 (bilagetext)-fält + Sista betalningsdag (bilagetext)) och Bilagor (Mall, Källhash) exakt per ADR-125 § 2; idempotent vid omkörning
- [ ] #2 Seed i staging: Platser = Rönninge verbatim ur förlagorna; Eventinnehåll = sju rader (kombinationerna mätta ur prod 2026-08-20) varav Resor i medvetandet 1 × Utbildning fylld verbatim ur prototypens EVENTINNEHALL-konstant inkl. agendan som Agendapunkter-rader
- [ ] #3 Datamodell-referensen bär tabell- och fält-ID:n för staging (prod-kolumnen markerad 'skapas efter GO, skiva 9') och en sektion om uppslaget Event (source) × Typ och härledningen av sista betalningsdag
- [ ] #4 Läsvägen: en EF returnerar för ett eventId hela ifyllnadsunderlaget { event, eventinnehall, plats, agenda, kopior } med standard/kopia per block, i en form som renderaren och klienten delar (Zod-schema i domänlagret, adapter-metod i kontraktet, båda adaptrarna); staging-test bevisar standard när kopian är tom och kopian när den finns
- [ ] #5 Purge-policyn bär targets för staging-rader som testerna skapar i de tre nya tabellerna; permanenta seed-rader rörs aldrig
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
