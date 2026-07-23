---
id: TASK-18.13
title: 'Skiva: Familje-rivningen (prototypsubstratet)'
status: To Do
assignee: []
created_date: '2026-07-21 08:21'
updated_date: '2026-07-23 07:38'
labels:
  - ready-for-agent
dependencies:
  - TASK-17.1
  - TASK-17.2
  - TASK-17.3
  - TASK-17.4
  - TASK-17.5
  - TASK-18.1
  - TASK-18.2
  - TASK-18.3
  - TASK-18.4
  - TASK-18.5
  - TASK-18.6
  - TASK-18.7
  - TASK-18.8
  - TASK-18.9
  - TASK-18.10
  - TASK-18.11
  - TASK-18.12
  - TASK-19.1
  - TASK-19.2
  - TASK-19.3
  - TASK-19.4
parent_task_id: TASK-18
ordinal: 63000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
När hela familjen är byggd rivs event-familjens konvergens-substrat: de fyra prototypsidorna (`src/components/events/prototype/*.tsx` — EventsList/EventDetail/SkapaEvent/ManuellAnmalan-Prototype), demo-datat och routernas `?variant=`-prototypgrenar (event/index · event/$eventId/index · event/skapa · event/$eventId/ny-anmalan) — plus de nu döda supersederade ytorna som flaggats i noterna (anmalda-vyn/EventRegistrations, standalone-närvaron/EventAttendance, AddRegistrationModal). Faciten bärs vidare av bilagorna och git-historiken (throwaway-kontraktets klausuler iv och v — prototypkod absorberas aldrig, riven vid skarpa byggets slut).

**VÄXLAREN BEHÅLLS (SCOPE-KORRIGERING mot ADR-074).** `src/components/dev/PrototypeSwitcher.tsx` är per ADR-074 (beslut 4 + rad 110–112) en STÅENDE delad dev-komponent som består — den byggdes OM i S76 (TASK-29, ikon-railen, sex granskningsvågor) till permanent verktyg för kommande familjer/produkter. Detta korrigerar kortets ursprungstext (skriven 2026-07-21, FÖRE S76) som sa 'riv prototyp-växlaren' — ADR-074 (2026-07-22) är nyare och styrande, och adresserar 18.13 explicit.

Inga skarpa ytor rörs. Täcker inga användarberättelser — kontraktsstädning.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S73-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [ ] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Prototyp-instanserna + demo-datat + routernas prototypgrenar + de döda supersederade ytorna borta; appen bygger grönt utan DEV-prototyp-grenar. PrototypeSwitcher.tsx BEHÅLLS (ADR-074 beslut 4).
- [ ] #2 Skarpa flödena opåverkade: fulla e2e-sviten grön efter rivningen
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FLAGGAT ur S75 batch 3 (task-18.4:s leverans): /event/$eventId/anmalda-routen + EventRegistrations.tsx + tests/e2e/event-anmalda.staging.test.ts är nu OÅTKOMLIGA från eventsidan — 18.4 rev interim-länken när arbetskön tog över ytan (samma mönster som 18.8 lämnade den gamla betalnings-vyn). Testerna passerar fortfarande eftersom de navigerar direkt till routen, så inget är rött; ytan är bara död. Rivningen hör till detta kort — flaggat så den inte glöms.

UTÖKAD RIVNINGSYTA ur S75 batch 4 (18.9:s leverans): standalone-närvaron är nu SUPERSEDERAD av det inline-registret men behållen per RIV INGENTING. Filerna: src/routes/_authenticated/event/$eventId/narvaro.tsx + EventAttendance.tsx + tests/e2e/event-narvaro.staging.test.ts. EventAttendance.tsx räknar dessutom fortfarande närvaro klient-side ur status medan registret nu binder basens Närvaropoäng (narvaropoang) — källinkonsistens som försvinner när standalone rivs. Lägg dessa i rivningens filuppsättning (utöver anmalda-vyn 18.4 flaggade).

UTÖKAD RIVNINGSYTA ur S75 batch 6 (18.12:s leverans): create-registration har nu TVÅ konsumenter med olika fält-omfång — den skarpa manuell-anmälan-sidan (ManuellAnmalanForm, 6 fält inkl. Antal platser + Notering) och den GAMLA AddRegistrationModal (/anmalda, 4 fält). Skillnaden är ofarlig men försvinner först när AddRegistrationModal rivs. Lägg modalen i rivningens filuppsättning (utöver anmalda-vyn + standalone-närvaron som redan flaggats).

SCOPE-KORRIGERING (2026-07-23, S75 Del 13 — Marcus-beordrad efter S76-läsning): kortets ursprungliga Description + AC #1 sa 'riv prototyp-växlaren'/'växlaren borta'. Det KONFLIKTAR med ADR-074 (rad 110–112 + beslut 4): 'PrototypeSwitcher är stående delad dev-komponent och består'. Konflikten är äkta, inte språklig. Rotorsak: kortet skrevs 2026-07-21, FÖRE S76; i S76 byggdes växlaren OM (T80-grillning → ADR-074 → TASK-29, ikon-railen genom sex Marcus-granskningsvågor) från slit-och-släng till PERMANENT delad dev-verktygsyta för kommande familjer/produkter. ADR-074 är nyare + styrande + adresserar 18.13 explicit → ADR:n vinner. Description + AC #1 omskrivna: 18.13 river de fyra prototyp-INSTANSERNA + demo-data + routernas ?variant=-grenar + de döda supersederade ytorna; PrototypeSwitcher.tsx BEHÅLLS.

DISK-VERIFIERAT rivnings-inventarium: (a) src/components/events/prototype/{EventsList,EventDetail,SkapaEvent,ManuellAnmalan}Prototype.tsx · (b) routernas prototypgrenar i event/index.tsx, event/$eventId/index.tsx, event/skapa.tsx, event/$eventId/ny-anmalan.tsx · (c) döda ytor: /event/$eventId/anmalda + EventRegistrations.tsx + event-anmalda e2e · standalone-närvaron (narvaro.tsx + EventAttendance.tsx + event-narvaro e2e) · AddRegistrationModal. BEHÅLLS: src/components/dev/PrototypeSwitcher.tsx.

ÖPPEN FÖLJDFRÅGA (Marcus vill resonera senare — EJ beslutad): efter rivningen har PrototypeSwitcher INGA konsumenter kvar i event-familjen (idag monteras den av instanserna + de fyra routerna). Alternativ A: låt den stå oanvänd (ren ADR-074-läsning, verktyget vilar tills nästa prototyp-pass). Alternativ B: ge den ett hem nu (t.ex. en /dev-route som monterar den) så den är levande/testbar. Code-gissning A, men Marcus beslutar. Detta avgör om rivningen får lämna en oanvänd-men-behållen komponent (kan kräva biome/dead-code-hantering) eller om ett litet /dev-mount ingår i 18.13:s scope.
<!-- SECTION:NOTES:END -->
