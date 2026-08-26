---
id: TASK-309.2
title: >-
  Skiva 1: Datamodellen i staging — Eventinnehåll, Agendapunkter, Platser,
  (bilagetext)-fält, Mall/Källhash — plus läsvägen
status: Done
assignee: []
created_date: '2026-08-23 13:58'
updated_date: '2026-08-24 17:02'
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
- [x] #1 Ett Meta-API-skript (staging-låst, samma lås-mönster som create-bilagor-table) skapar tabellerna Eventinnehåll, Agendapunkter, Platser och fälten på Eventplanering (Plats-länk + 17 (bilagetext)-fält + Sista betalningsdag (bilagetext)) och Bilagor (Mall, Källhash) exakt per ADR-125 § 2; idempotent vid omkörning
- [x] #2 Seed i staging: Platser = Rönninge verbatim ur förlagorna; Eventinnehåll = sju rader (kombinationerna mätta ur prod 2026-08-20) varav Resor i medvetandet 1 × Utbildning fylld verbatim ur prototypens EVENTINNEHALL-konstant inkl. agendan som Agendapunkter-rader
- [x] #3 Datamodell-referensen bär tabell- och fält-ID:n för staging (prod-kolumnen markerad 'skapas efter GO, skiva 9') och en sektion om uppslaget Event (source) × Typ och härledningen av sista betalningsdag
- [x] #4 Läsvägen: en EF returnerar för ett eventId hela ifyllnadsunderlaget { event, eventinnehall, plats, agenda, kopior } med standard/kopia per block, i en form som renderaren och klienten delar (Zod-schema i domänlagret, adapter-metod i kontraktet, båda adaptrarna); staging-test bevisar standard när kopian är tom och kopian när den finns
- [x] #5 Purge-policyn bär targets för staging-rader som testerna skapar i de tre nya tabellerna; permanenta seed-rader rörs aldrig
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
Skiva 1 levererade bilagornas datamodell i staging — tabellerna Eventinnehåll, Agendapunkter och Platser, (bilagetext)-fälten plus Plats-länk på Eventplanering, Mall och Källhash på Bilagor — via ett idempotent, staging-låst Meta-API-skript, seedad per ADR-125 § 2 (Rönninge verbatim; sju kombinationer varav en fylld). Plus läsvägen: get-document-sources returnerar hela ifyllnadsunderlaget { event, eventinnehall, plats, agenda, kopior } med standard/kopia per block, i en form renderaren och klienten delar (Zod-schema i domänlagret, adapter-metod i kontraktet, båda adaptrarna).

BARS AV: PR #1870, commit da2df248 (MERGED 2026-08-23T15:22Z, 16 filer).
GRIND-UTFALL: 11 CheckRuns SUCCESS + 3 SKIPPED + Vercel SUCCESS på exakt da2df248 — noll icke-gröna.

AC #5 BOCKAD 2026-08-24 MOT MÄTNING, inte antagande. Purge-policyn bär tre targets för de rader testerna faktiskt skapar:
- `save-event-text-agendapunkter-sentineler` — Agendapunkter, Text, ^ZZ-TASK-309.3-
- `save-place-standard-platser-sentineler` — Platser, Namn, ^ZZ-TASK-309.3-
- `save-place-standard-event-los-platser-sentineler` — Platser, Namn, ^ZZ-TASK-309.7-
Eventinnehåll saknar target MEDVETET och korrekt: inget test SKAPAR rader där. `tests/api/save-event-content.staging.test.ts` muterar-och-återställer EN av de permanenta, redan tomma seedade raderna (Psionautics × Utbildning), med precondition-skip om raden inte är tom och ovillkorlig afterAll-återställning. Kravets andra led ("permanenta seed-rader rörs aldrig") är strukturellt uppfyllt: targets är prefix-ankrade och `scripts/seed-eventinnehall-modell.mjs` innehåller NOLL `ZZ-TASK-309`-strängar (grep -c = 0), så ingen seedad rad kan matchas.
BEVIS: `node scripts/test-purge-staging-sentinels.mjs` exit 0 — sviten bär explicita disk-assertions för alla tre targets ovan plus negativa kontroller.

DoD-belägg: #1 fem av fem AC bockade · #3 rollupen ovan. Punkterna #2, #4, #5 och #6 var redan bockade av bygg-agenten.

Stängd av orkestrerad stängningsagent 2026-08-24 mot post-merge-bevis.
<!-- SECTION:FINAL_SUMMARY:END -->
