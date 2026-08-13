---
id: TASK-208
title: >-
  Granskningsfixturen skapar Deltaganden för sina anmälda — check-in-vyn blir
  granskningsbar
status: To Do
assignee: []
created_date: '2026-08-13 18:14'
updated_date: '2026-08-13 18:33'
labels: []
dependencies: []
ordinal: 383000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Granskningsfixturen (npm run seed:review) skapar event + anmälningar men INGA Deltaganden för dem — Deltaganden-skapandet ligger enbart i RIK-LÄGE-grenen och bygger den rika personens historik, inte en närvarolista. Check-in-prototypen (src/components/events/CheckinPrototyp.tsx) drivs av VERKLIG data: get-attendance + get-registrations, joinade klientside på Deltagande.anmalanId till Registration.id. Utan Deltaganden-rader är listan tom och ingen av de tre varianterna (A rutnat person x session, B lang lista, C sok-forst) gar att bedoma. Mätt 2026-08-13 mot staging apphjj8Q7lkXCMsL4: nio Deltaganden-rader TOTALT i hela basen; granskningsfixtur-eventet recDUMxyXI8hFHOg3 (Falköping, 2026-08-18) har 17 anmälningar men EN enda Deltagande-rad.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 npm run seed:review -- --ort <ort> --bekraftade 8 --obekraftade 8 --dagar 8 skapar en Deltagande-rad per anmälan och session (2 sessioner: Dag 1 + Dag 2) i Status 'Ej avstämt', utan ny flagga
- [x] #2 Varje skapad Deltagande-rad bär Anmälan-, Event- och Person (länk)-länkarna satta, så prototypens join Deltagande.anmalanId -> Registration.id traffar och personNamn kan berikas av get-attendance
- [x] #3 Efter-verifiering i skriptet läser eventets 'Närvaro (records)' — exakt det fält get-attendance läser — och fäller hårt om antalet avviker
- [x] #4 Session-värdena är PINNADE konstanter härledda ur config.select (ingen schema-läsning, ingen typecast) och kopplingen till det pinnade eventformatet är dokumenterad + mekaniskt validerad i validateConfig
- [x] #5 npm run seed:review:clean städar de nya raderna utan ändring i städlogiken (satellit-städningen via Personer.Deltaganden), bevisat skarpt mot staging
- [x] #6 .purge-staging-policy.json är ORÖRD — ZZ-GRANSKNING-*/granskningsfixturen får aldrig bli purge-bar
- [x] #7 scripts/test-seed-review-fixture.mjs utökad tvåsidigt (positivt + negativt fall) för det nya bygget; hela sviten grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
IMPLEMENTATION (S103, 2026-08-13)

Deltaganden följer med AUTOMATISKT — ingen ny flagga. Motivering, tre led:
(1) Skriptet emulerar redan automation A2 (sätter Anmälan.Person självt) eftersom
staging-automationerna är AVSTÄNGDA — mätt, ej antaget: 16 anmälningar gav 0
Deltaganden. Deltaganden är A3:s jobb, SAMMA klass och samma skäl, en tabell
längre ned. (2) Uppdragets målbild är exakt kommandot i CLAUDE.md § Granskningsdata
— det bär ingen flagga. (3) Raderna är ROLLUP-NEUTRALA i 'Ej avstämt' och kan
därför inte störa en person-granskning: mätt live på recivyQsdr3UyYg8U (2
Deltaganden) — Antal genomförda event 0, Genomförda dagar 0, Utbildningsdagar
genomförda 0, RIM 1/2/3 × och Fjärrskådning × alla 0, Erfarenhetsbadge 'Ej
påbörjat', Närvaro (text) '-'. Ingen opt-out byggd (över-engineering-vakten:
ingen faktisk användare).

SESSIONS-DIMENSIONEN: BÅDA sessionerna, en rad per Anmälan × Session. Fixturens
event är ALLTID tvådagars — korCreate sätter Slutdatum = Startdatum+1 med
kommentaren 'Eventformatet är Dag 1 + Dag 2', och det pinnade
eventformatRecordId recclDd7hUQsfxoVs ger Sessionsmall ['Dag 1','Dag 2']
(live-verifierat på recDUMxyXI8hFHOg3 OCH på den nya fixturen). Bara 'Dag 1' hade
gjort varje variant grön av fel skäl — prototypens docblock kallar
sessions-dimensionen 'den skarpaste öppna designfrågan' och variant A visar
sessionerna som kolumner. CONFIG.narvaro.sessioner lagrar NYCKLAR in i select,
aldrig egna strängliteraler; validateConfig fäller en literal, en dubblett och
en okänd statusNyckel.

RIK-LÄGET: dess primära Deltagande borttaget — närvaro-passet täcker hela batchen
inkl. --rik-personen, och med BÅDA sessionerna. Kvar i RIK-grenen: bara historiken.
Utan den ändringen hade den rika personen fått en dubblett på Dag 1.

EFTER-VERIFIERING mot eventets 'Närvaro (records)', inte mot vårt eget create-svar:
det är EXAKT fältet get-attendance läser (supabase/functions/get-attendance/index.ts).
En grön räkning bevisar därmed LÄSVÄGEN, inte bara skrivningen — ett event utan
fältet ger tom lista i vyn, aldrig ett fel.

STÄDNINGEN OFÖRÄNDRAD. Satellit-städningen samlade redan Deltaganden via
Personer.Deltaganden; symmetrin med Deltaganden.'Person (länk)' live-verifierad
mot staging (recxF88ZKUbP9JUs1 bar exakt de 5 rader vars Person (länk) pekade
tillbaka). Bevisad skarpt på en SEPARAT kastbar fixtur
(ZZ-GRANSKNING-S208-CLEANTEST, event rec7FlVWUiTkbvtkB): 8/8 Deltaganden raderade,
efter-verifiering 0 kvar — Marcus granskningsfixtur orörd.

MÄTT UTFALL, skarp körning mot staging apphjj8Q7lkXCMsL4:
  event reckgn7arcyW367qT (EventKey Event-6642), Ort ZZ-GRANSKNING-S103,
  2026-08-21 → 2026-08-22, 16 anmälningar, 32 Deltaganden.
  Oberoende Airtable-MCP-verifiering: 32 rader, alla Status 'Ej avstämt',
  Närvaropoäng 0, 16 på Dag 1 + 16 på Dag 2, varje rad med Anmälan + Event +
  Person (länk); eventets Närvaro (records) bär exakt 32 ID:n.
  Basen totalt: 41 Deltaganden (9 före + 32 nya), noll föräldralösa.

GRINDAR: node scripts/test-seed-review-fixture.mjs exit 0 — 182 gröna
(BASELINE 165, MÄTT genom att köra origin/main-versionen i worktreen; +17 nya).
npm run typecheck exit 0 · npx @biomejs/biome check . exit 0 ·
npm run test:api exit 0 (711 passed) · npm run build exit 0.
Mutationsrunda 3/3 fäller: M1 (bara Dag 1) 1 rött, M2 (Status Närvarande) 2 röda
inkl. rollup-neutralitetsvakten, M3 (Anmälan-länken borttagen) 3 röda.

RÄTTELSE (egen, mätt efter commit 19ddd713): commit-meddelandet och den första
versionen av dessa notes påstod 'baseline 160, +22'. Båda talen var OBELAGDA —
jag skrev dem utan att ha kört baseline-sviten. Den faktiska mätningen
(git checkout origin/main -- scripts/test-seed-review-fixture.mjs
scripts/seed-review-fixture.mjs, kör, återställ) ger 165 gröna före och 182 efter,
alltså +17. Talet i commit 19ddd713 är därmed fel och rättas här i stället för att
skrivas om med force-push mot en armerad PR. Antalet nya t()-block räknat för hand
i diffen: 17 — samstämmigt med mätningen.

.purge-staging-policy.json ORÖRD (git diff --name-only mot origin/main: tomt).
ZZ-GRANSKNING-* förblir icke-purge-bar.

OVÄNTAT FYND (ADR-053-triage: blockerar ej, värdefullt → registrerat, ej åtgärdat):
Personers 'Kommande event'-rollup saknar sessions-dedup. Person recivyQsdr3UyYg8U
har EN anmälan men TVÅ Deltaganden (Dag 1 + Dag 2) och visar därför 'Kommande
event: 2', och 'Nästa event (rad)' listar samma event två gånger. Detta är basens
EGET beteende, inte fixturens: A3 skapar en rad per session även i prod, så varje
verkligt tvådagars-event dubbelräknas likadant. Samma felklass som den REDAN
dokumenterade i data-model.md (raden om att 'Session-filtret är kritiskt … hindrar
att ett tvådagars-event räknas dubbelt') — där löst för 'Genomfört event' via
dedup-formeln, men uppenbarligen inte för 'Kommande event'. Fixturen AVTÄCKER
alltså en defekt i datakällan, vilket är precis vad ADR-063 säger att den ska
göra. Kräver Marcus/orkestrerar-beslut om hemvist (defekt-registret i
data-model.md § Kända fällor) — ingen åtgärd tagen här, utanför detta korts scope.
<!-- SECTION:NOTES:END -->
