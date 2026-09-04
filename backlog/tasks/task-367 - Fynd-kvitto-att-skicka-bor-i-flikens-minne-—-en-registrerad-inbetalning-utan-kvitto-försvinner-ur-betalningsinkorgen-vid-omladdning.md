---
id: TASK-367
title: >-
  Fynd: 'kvitto att skicka' bor i flikens minne — en registrerad inbetalning
  utan kvitto försvinner ur betalningsinkorgen vid omladdning
status: To Do
assignee: []
created_date: '2026-09-03 07:46'
labels:
  - ready-for-agent
dependencies: []
ordinal: 665000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Symptom
Marcus registrerade en inbetalning i prod (2026-09-03, Cecilia Örning, 2 500 kr) med knappen Registrera, bytte flik, och raden var borta ur betalningsinkorgen. Inkorgens serverfunktion listar bara anmälningar med Saknas (kr) > 0, och listan över väntande kvitton byggs av registreringar gjorda i DENNA flik (React-state) — filhuvudet i BetalningsInkorg.tsx bokför det som känd gräns: 'stängs fliken innan Lotta tryckt på knappen är listan borta, och inbetalningarna står kvar utan kvitto'. Hem-kortets 'K kvitton att skicka' räknar bara rader som redan ligger i kön. Belägg: sessionsdok S115 Del 2 (prod-Postgres: en aktiv inbetalning, kvitto_id tomt, noll jobbrader; inget mail i Resend).

## Förväntat beteende
'Kvitto att skicka' härleds ur Postgres, inte ur flikens minne: en aktiv inbetalning utan kvitto_id och utan jobbrad i vantar/pagar ÄR ett kvitto att skicka. Serverfunktionen hamta-oppna-betalningar läser redan varje inbetalning och kön per hämtning, så härledningen kostar inga extra anrop. Inkorgen visar sådana anmälningar i en 'Kvitto att skicka'-sektion även när Saknas (kr) = 0, Hem-kortet räknar dem, och 'Skicka N kvitton' bygger sin lista ur samma härledning. Omladdning, flikbyte eller ny enhet får aldrig tappa ett oskickat kvitto.

## Källa
PRD TASK-346 § Kvittot ('Registrera först, skicka sedan') och § Inkorgen ('K kvitton att skicka'); S115 Del 2 (2026-09-03). Inte prestanda: den omedelbara känslan vid Registrera kommer från cache-patchen med serverns svar, som behålls.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
