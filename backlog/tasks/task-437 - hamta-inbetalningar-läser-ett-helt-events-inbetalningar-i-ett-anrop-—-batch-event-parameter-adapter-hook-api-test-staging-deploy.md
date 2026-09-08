---
id: TASK-437
title: >-
  hamta-inbetalningar läser ett helt events inbetalningar i ett anrop —
  batch/event-parameter, adapter, hook, api-test, staging-deploy
status: To Do
assignee: []
created_date: '2026-09-08 02:21'
updated_date: '2026-09-08 03:02'
labels:
  - ready-for-agent
dependencies: []
ordinal: 764000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Behov: Händelseloggen på eventdetaljen (TASK-436 → TASK-438) ska visa inbetalningar för ALLA personer i ett event. Dagens läsning är per anmälan — `useInbetalningarPerAnmalan` (`src/data/betalningar/useBetalningar.ts` rad 78–87, `enabled: aktiv`) mot EF `supabase/functions/hamta-inbetalningar` — vilket ger ett anrop per person; `src/components/betalningar/PanelBetalningar.tsx` docblock rad 74–81 avvisar exakt det mönstret ("tjugo Edge Function-anrop"). Marcus kvitterade 2026-09-08 en serverläsning som tar hela eventet i ett anrop.

DESIGNVAL SOM AGENTEN GÖR OCH BOKFÖR I PR-KROPPEN: EF:en tar antingen en batch av anmälnings-record-ID:n (klienten har redan eventets anmälningar ur `useRegistrations`/eventvyn) eller ett `eventId`. Läs EF:en, migrationerna för `inbetalningar` (finns en event-kolumn eller bara `anmalan_record_id` + `ogonblicksbild_eventdatum`?) och hur `spegel`/`jobbfel` beräknas per anmälan innan valet — rekommendationen från orkestreraren är batch av anmälnings-ID:n (ingen Airtable-uppslagning i EF:en, samma rad-typ som i dag), men mätningen avgör. Svaret grupperas per anmälan med samma radform som i dag (`InbetalningSchema`, `src/domain/schemas/Betalningar.schema.ts` rad 57–93) så `InbetalningsLista` och loggen delar typ.

DEPLOY-ORDNING: staging-EF deployas av agenten för api-testet (staging är öppen för agenter); PROD-deploy görs av Marcus via `bash scripts/fas4-prod-deploy.sh --deploya <prod-ref>` i eget terminalfönster (CLAUDE.md § Prod-EF-deploy) FÖRE klient-PR:en TASK-438 landar — samma ordning som noteringsfältet 2026-09-01 (`supabase/functions/registrera-inbetalning/index.ts` rad 31–36 § DEPLOY-ORDNINGEN). Agenten rör ALDRIG prod.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 EF:en svarar för en batch av anmälningar eller ett event i ETT anrop med zod-validerad input och tak på batchstorlek; befintliga anrop (anmalanRecordId/personId) oförändrade — bakåtkompatibelt, bevisat av befintliga api-tester
- [x] #2 DataSourceAdapter + adaptrar + ny hook med egen queryKey; svar grupperat per anmälan med samma Inbetalning-radtyp som i dag
- [x] #3 api-test mot staging: batch med två anmälningar med kända inbetalningar returnerar båda grupperna; tom batch och okänt id ger tom grupp utan fel; över tak fälls med 400
- [x] #4 Staging-EF deployad av agenten och verifierad med functions list (UPDATED_AT); prod-deploy bokförd som Marcus-steg i PR-kroppen med exakt kommando — aldrig utförd av agenten
- [x] #5 DoD-kommandona gröna med faktiska exitkoder
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
