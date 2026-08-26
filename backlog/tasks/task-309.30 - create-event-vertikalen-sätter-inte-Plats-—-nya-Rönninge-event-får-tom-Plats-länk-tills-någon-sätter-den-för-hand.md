---
id: TASK-309.30
title: >-
  create-event-vertikalen sätter inte Plats — nya Rönninge-event får tom
  Plats-länk tills någon sätter den för hand
status: To Do
assignee: []
created_date: '2026-08-26 05:02'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 596000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Öppen kant ur Plats-backfillen 2026-08-26 (S108 Del 24 § B, data-model § Prod-ID:n): alla 27 befintliga Rönninge-event fick Plats → recZc1EMWMYw5KADo (prod) på Marcus GO, men create-event (ADR-066-vertikalen, supabase/functions/create-event + klientens CreateEventForm) känner inte till Plats-fältet (fött 2026-08-24, ADR-125 § 2). Nästa event Lotta skapar i appen med Ort = Rönninge får tom Plats → bilagans adress-/parkerings-/transport-/klädblock faller tillbaka på TOMT i stället för Rönninges standard, och hon måste sätta platsen för hand (var? — verifiera om genereringsvyn ens bär en platsväljare; om inte finns ingen väg utom Airtable-UI:t).

DESIGNFRÅGA (avgör med research, bokför): (a) create-event slår upp Platser på Namn = Ort och länkar automatiskt när exakt en träff finns (härledning, inte länk-krav — samma anda som Eventinnehåll-uppslaget 'Event × Typ, ingen länk', ADR-125 § 2); (b) klienten får en platsväljare i CreateEventForm (formändring — Marcus); (c) båda. Rekommendation att pröva: (a) som golv nu (noll formändring, täcker Rönninge-fallet som är ~alla event), (b) som eget kort om Marcus vill. Datakällans kontrakt: data-model.md § Eventplanering (fält-ID:n prod fldaVV1KS6skbOLrB / staging fld8OmPGNgEYZ8eER); staging först via API-test (api-staging), prod-deploy via fas4-prod-deploy.sh (Marcus). Skydd: aldrig skriva över en redan satt Plats; ingen träff eller flera träffar → lämna tomt och logga.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Beslut (a)/(b)/(c) bokfört med research-källa; om (a): create-event länkar Plats när exakt en Platser-rad matchar Ort, aldrig annars, aldrig över befintlig länk — staging-API-test i båda riktningar (träff → länk; ingen/flera träffar → tom + loggrad)
- [ ] #2 data-model.md § Eventplanering + ADR-066/ADR-125 § Updates bär beteendet; prosa och kod säger samma sak
- [ ] #3 Klientens skapa-event-flöde oförändrat i form (ingen ny kontroll) om (a) valdes; annars formändringen som eget kort för Marcus
- [ ] #4 Prod-deploy bokförd som Marcus-moment; staging-EF:en deployad och UPDATED_AT verifierad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
