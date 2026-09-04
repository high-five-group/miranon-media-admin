---
id: TASK-346.15
title: >-
  Pris och anmälningsavgift per event i appen — fält i Skapa nytt event +
  synligt/redigerbart på eventsidan, skrivväg i create-event/update-event
status: To Do
assignee: []
created_date: '2026-09-02 08:18'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-346
priority: medium
ordinal: 661000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
VARFÖR: grillningen 2026-08-30 (S113 Del 11, beslut 1/7/12) la priset i basen: standardpris per eventtyp på Eventinnehåll, per-event-pris på Eventplanering (Pris (kr) fldKaPiIzRdQiaif3 + Anmälningsavgift (kr) fldOBOP5gx3eiAPmL, skapade i staging TASK-346.2 och i prod 2026-09-01), avtalat pris per anmälan i appen (byggt). Per-event-priset kan i dag INTE sättas i appen: src/components/event/CreateEventForm.tsx + supabase/functions/create-event/index.ts skriver Typ/Ort/Startdatum/Max antal platser utan pris; supabase/functions/update-event/index.ts har en fält-allowlist (_shared/field-allowlists.ts) där Pris (kr)/Anmälningsavgift (kr) saknas. Marcus 2026-09-02 (S113 resume 8): 'ett prisinmatningsfält [måste] in i Skapa nytt event-formuläret ... under eventdetaljer så måste det gå att se och ändra priset' — GO på formen nedan. Steg 12 i prod-runbooken sattes 2026-09-02 för hand via MCP (2500 kr på tio kommande event) i brist på denna yta.

FORM (Marcus GO): (1) Skapa nytt event: två talfält Pris (kr) och Anmälningsavgift (kr), FÖRIFYLLDA från vald eventtyps standard på Eventinnehåll (samma uppslag som betalnings-härledningen använder, data-model.md § Uppslaget Event (source) × Typ), ändringsbara; föreläsning har bara Pris. (2) Eventsidan: samma två fält synliga och redigerbara (egen Spara-väg i samma mönster som avtalat pris på anmälan, S113 Del 14). (3) create-event + update-event skriver fälten; allowlisten i _shared/field-allowlists.ts utökad; ef-metod-vakt/allowlist-tester tvåsidiga. (4) Bilagemallarnas fritextfält Pris (bilagetext)/Anmälningsavgift (bilagetext) RÖRS INTE (grillningens beslut: fritexten byter aldrig typ).

KÄLLOR: tasks/sessions/2026-08-29-session-113.md Del 11 + Del 16 · backlog TASK-346 § Datamodell · docs/reference/data-model.md § Prod-fälten · docs/reference/prod-driftsattning-betalningsflodet-runbook.md § Steg 12.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Skapa nytt event visar Pris (kr) + Anmälningsavgift (kr), förifyllda från eventtypens Eventinnehåll-standard, ändringsbara; föreläsning visar bara Pris
- [ ] #2 Eventsidan visar båda fälten och kan spara ändring med egen Spara-knapp; värdet syns i Airtable Eventplanering efter sparning (staging-bevis)
- [ ] #3 create-event och update-event skriver fälten; update-events allowlist utökad; negativ kontroll bevisar att ett icke-tillåtet fält fortfarande nekas
- [ ] #4 Betalnings-härledningen (Saknas (kr), beloppsknapparna) läser det nya per-event-priset utan kodändring (verifierat med ett event vars pris avviker från standarden)
- [ ] #5 Bilagetext-fälten orörda; a11y axe 0 på båda ytorna; skärmdumpar desktop + iPad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
