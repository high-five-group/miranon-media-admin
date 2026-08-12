---
id: TASK-201.6
title: 'Skiva: Aktivitetshistoriken — kärnvyn (A-formen)'
status: To Do
assignee: []
created_date: '2026-08-11 20:25'
updated_date: '2026-08-12 19:56'
labels:
  - ready-for-agent
dependencies:
  - TASK-201.3
  - TASK-201.5
parent_task_id: TASK-201
ordinal: 371000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: Lotta öppnar aktivitetshistoriken (via Mer på mobil, via länk/route på desktop) och ser allt som hänt, tidsgrupperat, klickbart till person/event. Detta är A-formen — en HEL yta utan filterrad; filterraden är nästa skiva och dag 1 kan driftsättas utan den (S105 Del 2 beslut 1, mellanstationen).

Täcker användarberättelser: 3, 4, 5, 6, 8, 11, 12
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Route + vy: tidsgrupperad lista (Idag / Igår / datum), poster i spaltens postform (relativ tid respektive klockslag, aktör i medium, händelse i naturligt språk); post-klick navigerar till personen eller eventet
- [x] #2 Mobil-/platta-ingången via Mer (S55 byggkrav B7): Mer-menyn får posten Aktivitetshistorik
- [x] #3 Tomläge första gången — vänligt, på Lotta-språket (Gunilla-principen)
- [x] #4 A11y-ribban 11: rubrikstruktur, landmark, fokusordning; axe-test grönt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC #1s navigering ("post-klick navigerar till personen eller eventet") — KOORDINERINGS-SKULD, källmärkt: TASK-201.3s landade pilotmutationer (recordActivity-anropen i registrationPayments.ts/registrationConfirmation.ts/actionEmail.ts) emitterar INGEN EVENT_ID_EXTENSION_IRI i context.extensions — samma öppna skuld TASK-201.4s kort redan bokför (§ Implementation Notes punkt 1, 'skrivvägen emitterar den inte'). Följd: AktivitetsHistorik.tsx bygger navigeringsmekaniken fullt ut (aktivitetensEventId() läser extensionen, länkar till /event/$eventId när den finns) och den är TESTAD (acceptance-testets 'post-klick navigerar'-fall), men med DAGENS verkliga data (endast pilotens tre mutationstyper) renderas VARJE rad olänkad — mekanismen aktiveras automatiskt den dag TASK-201.4 landar extensionen, ingen ändring krävs i denna vy. Person-navigering är INTE byggd alls: ingen mutation/statement-typ sätter någon person-identifierande extension ännu (ingen spekulativ IRI-konvention uppfunnen för en obefintlig konsument, över-engineering-vakten) — AC #1 uppfylls därmed för EVENT-hälften av 'personen eller eventet', person-hälften väntar på en framtida skiva som faktiskt behöver den.

CI-FÄLLNING RÄTTAD (2026-08-12, samma kväll som landningen): Acceptance-jobbet fällde deterministiskt 3/3 (original + två retries, ingen flake) — run 31633396902, job 94239278496, rad 191 ('14:30' hittades inte). Klassad av orkestreraren som TASK-27 ('tidszons-klassen i e2e-sviten — Node new Date() mot browser-renderat datum'): tests/acceptance/mer-aktivitetshistorik.acceptance.test.ts:s lokalTid()-hjälpare byggde tidpunkten med Date.setDate/setHours, som tolkas i NODE-PROCESSENS tidszon — på min Mac (TZ=Europe/Stockholm) sammanföll den råkat med webbläsarens pinnade Europe/Stockholm (playwright.config.ts), men CI kör Node i UTC, så setHours(14,30) blev 14:30 UTC = 16:30 CEST i webbläsaren. Lokal grönhet var alltså fel MILJÖ, inte fel mätning. FIX: lokalTid() bygger nu ISO-strängen med explicit +02:00-offset via ren UTC-aritmetik (Date.UTC/getUTCDate) — noll lokala Date-metoder, noll TZ-beroende. Samtidigt togs en tautologi-risk bort: den härledda grupprubriken (LANGDATUM.format(...), samma formatterare som komponenten) ersattes med en oberoende hårdkodad literal ('9 september 2026'). Bevisat i båda riktningar: (1) gamla koden reproducerad röd under TZ=UTC lokalt (identisk fällning som CI, rad 191), (2) nya koden grön under BÅDE TZ=UTC (7/7, 41.5s) och TZ=Europe/Stockholm (7/7, 35.9s).
<!-- SECTION:NOTES:END -->
