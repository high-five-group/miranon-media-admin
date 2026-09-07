---
id: TASK-367
title: >-
  Fynd: 'kvitto att skicka' bor i flikens minne — en registrerad inbetalning
  utan kvitto försvinner ur betalningsinkorgen vid omladdning
status: To Do
assignee: []
created_date: '2026-09-03 07:46'
updated_date: '2026-09-06 18:27'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Review-fynd (runda 1, PR #2416): kortets beskrivning påstår att härledningen 'kostar inga extra anrop' — det stämmer för Postgres-sidan (en global fråga läggs till, ersätter ingen), men EF-huvudets ANROPSBUDGET-avsnitt (hamta-oppna-betalningar/index.ts) visar korrekt att en fullbetald anmälan med oskickat kvitto kräver en EXTRA batchad Airtable-sökning (+ceil(extra anmälningar / 50)). Kortets premiss är alltså felställd i den delen; koden är korrekt och dokumenterar sin egen budget.

Review-fynd (runda 2, PR #2416, FYND 1): prod-deployordningen är LÅST — (1) migrationen 20260906165100_inbetalning_kvitto_avbojt.sql i prod (supabase db push, Marcus eget terminalfönster, aldrig via !-prefixet), (2) scripts/fas4-prod-deploy.sh --deploya (registrera-inbetalning + hamta-oppna-betalningar, samma batch som get-event-attachments/416.12), (3) klienten är fri (Vercel följer main). Omvänd ordning (EF före migration) ger 42703/PGRST204 -> HTTP 500 på hela betalningsinkorgen och registreringen. Mellanläget klient-ny/EF-gammal är verifierat ofarligt (gamla EF:en läser body-fält explicit utan spread, medKvitto ignoreras tyst). Full text i PR-kroppens § Prod-driftsattning, ordning och i docs/reference/prod-driftsattning-betalningsflodet-runbook.md § Inkrementell deploy nar flodet redan ar i prod.

Review-fynd (runda 2, PR #2416, FYND 3, sidofynd): tests/e2e/atgarder-kvitto.staging.test.ts:482 faller konsekvent sedan TASK-402.8 (PR #2378) tog bort Obekraftad-pillen ur bekraftelsestegets kort — testet forvantar sig fortfarande en checkbox-etikett som innehaller 'Obekraftad' (VariantC.tsx rad 868 bekraftar rivningen i sitt eget docblock). Ror ingen fil i TASK-367:s diff — flaggat, inte tyst forkastat, per ADR-053.
<!-- SECTION:NOTES:END -->
