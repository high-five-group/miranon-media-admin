---
id: TASK-338.2
title: >-
  Skiva: EF read + write — matcharen i kod, en hämtning i get-event-attachments,
  skrivvägens tre axlar
status: To Do
assignee: []
created_date: '2026-08-29 08:03'
labels:
  - ready-for-agent
dependencies:
  - TASK-338.1
parent_task_id: TASK-338
ordinal: 612000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Efter skivan returnerar get-event-attachments för ett event unionen av (a) eventets egna bilagor och (b) alla rader med Räckvidd ≠ Event — hämtade i EN Airtable-hämtning — som matchar eventet på alla satta axlar: Kursfamilj (tom = alla), Kursnivå (tom-nivå-regeln oförändrad), Plats (länk-ID mot eventets Plats-länk, aldrig namn). Matcharen är en ren funktion i _shared med egen enhetstestsvit (ingen staging). Läsvägen tolererar legacy-värdena 'Kurstyp'/'Alla event' som Gemensam med sina axlar (så prod fungerar oavsett i vilken ordning EF-deploy och radmigrering sker i TASK-338.6). Svaret bär rackvidd ('Event'|'Gemensam'), kursfamilj, kursniva och plats {id, namn} (namn ur Platsnamn-lookupen). Räckviddsläget listar Räckvidd ≠ Event. Skrivvägen (upload-attachment + finalize-attachment-upload) tar rackvidd ∈ {Event, Gemensam}; vid Gemensam är kursfamilj, kursniva (bara med kursfamilj) och plats (Platser-record-ID, existenskontrollerat mot Platser — samma vaktklass som generate-event-attachments ersatt-guard) valfria; noll axlar giltigt; legacy 'Kurstyp'/'Alla event' accepteras och mappas till Gemensam (bokförd rivningsskuld i filhuvudet). Dagens tre filterByFormula-mängder rivs. Deployas till staging. Täcker användarberättelser: 2, 3, 4, 5, 9, 10, 16.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ren matchare i _shared med enhetstester (tests/api, deterministiska): tom axel begränsar inte; tom-nivå-regeln; Plats matchar på record-ID; familj-mismatch; plats-mismatch; kombination RIM+Rönninge; legacy-mappning Kurstyp/Alla event → Gemensam — varje fall grönt, antal fall bokfört
- [ ] #2 get-event-attachments.staging.test.ts utökad och grön mot deployad staging-EF: Rönninge-event ser en Plats=Rönninge-bilaga, ett event på annan plats ser den inte; RIM+Rönninge syns bara på RIM-event i Rönninge; inga axlar = syns på alla; svaret bär plats {id, namn}; dedup mellan mängderna
- [ ] #3 Skrivvägen: upload-attachment.staging.test.ts bevisar Gemensam med plats (sparas som länk), Gemensam utan axlar, ogiltigt plats-ID → 4xx, legacy 'Alla event' → sparas som Gemensam; Zod-schemat strikt på write-sidan (P22-noten kvar)
- [ ] #4 Räckviddsläget (fetchAllaGemensamma) listar Räckvidd ≠ Event; delete-attachment/atgarder-bilageval-sviterna fortsatt gröna; ingen klient-ändring krävs för Åtgärds-sidan (verifierat i acceptance-testet atgarder-bilageval-send)
- [ ] #5 Filhuvudena i attachments.ts och get-event-attachments/index.ts beskriver den nya formen (ADR-083); TASK-275.2-prosan om tre mängder omskriven, inte lämnad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #5 Deny/allow-test grönt för varje ny eller ändrad EF-operation (sub-fas-mönstret, field-allowlists)
- [ ] #6 Lagervakten grön — matchning och validering bor i EF/_shared, aldrig i klienten (ADR-057)
<!-- DOD:END -->
