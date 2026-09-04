---
id: TASK-368.2
title: >-
  Skiva: Operationen — allowlistad statusskrivning för avbokning och återtag,
  Notering-append, loggverb, adapter och mutation, API-test mot staging
status: To Do
assignee: []
created_date: '2026-09-03 07:57'
updated_date: '2026-09-03 08:40'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-368
ordinal: 668000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beteende ände-till-ände: appen kan sätta en aktiv anmälan till Avbokad/Ombokad med ett frivilligt skäl, och sätta tillbaka en avbokad anmälan till rätt status, härledd ur bekräftelsedatumet. Skälet hamnar som datumstämplad rad i anmälans Notering i basen utan att befintlig text går förlorad, och händelsen loggas i aktivitetsloggen. Ingen annan skrivning tillåts. Detta är serverkontraktet som skivan om anmälans sida bygger på. Täcker användarberättelser: 3, 4, 5, 9, 10, 20, 23, 24.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ny allowlist-operation skriver ENDAST Anmälningar.Status och Notering; tillåtna övergångar exakt två: aktiv status (Bekräftad (mail skickat), Betalningspåminnelse skickad, Obekräftad) till Avbokad/Ombokad, och Avbokad/Ombokad till härledd status (Bekräftad (mail skickat) om Bekräftelse skickad är satt, annars Obekräftad); alla andra övergångar och Inställt/Flytta till väntelista avvisas med 409 och begripligt fel
- [x] #2 Notering skrivs som append: befintlig text bevaras, ny rad på formen '[Avbokad ÅÅÅÅ-MM-DD av <aktör>] <skäl>' respektive '[Avbokning återtagen ÅÅÅÅ-MM-DD av <aktör>] <skäl>'; tomt skäl ger raden utan skältext
- [x] #3 Aktivitetsloggen får verben 'avbokade anmälan' och 'återtog avbokning' med anmälan som objekt (person-namn i objektnamnet), skrivna efter lyckad basskrivning, aldrig före
- [x] #4 Edge Function, adapter-metod och TanStack-mutation finns; mutationen invaliderar anmälan, event, inkorg och aktivitetslogg; idempotent vid dubbelanrop (andra anropet ändrar inget och loggar inget)
- [x] #5 API-test mot staging-funktionen (förebild: bekräftelseutskickets stagingtest) prövar tillåtna och förbjudna övergångar, Notering-append med bevarad text, loggverb och idempotens; allowlist-vakten grön; DoD-grindarna gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
EF cancel-registration (POST, atgard: avboka|aterta - ETT EF, hantera-inbetalnings-monstret, motiverat i EF:ens eget filhuvud). Pure orkestrator _shared/cancel-registration.ts (overgangstabell + Notering-append + Europe/Stockholm-datum) - Deno-fri, hermetiskt testad (21 fall, tests/api/cancel-registration.test.ts). Allowlist-post cancel-registration (_shared/field-allowlists.ts): Anmalningar.Status+Notering. Loggning SERVER-SIDE (avsteg fran bekraftelse-vertikalens klient-monster, motiverat i EF:ens filhuvud): ny AKTIVITETSTYP.anmalan + ANMALAN_VERB.avbokade/.atertogAvbokning i _shared/aktivitetslogg.ts, skrivet via befintlig skrivAktivitet (_shared/betalningar-db.ts).

Klient: CancelRegistration.schema.ts (input/result), DataSourceAdapter.avbokaAnmalan/atertaAvbokning (AirtableAdapter implementerar, SupabaseAdapter NOT_IMPLEMENTED-stub som confirmRegistrations), mutationer useAvbokaAnmalan/useAtertaAvbokning (src/data/mutations/registrationCancellation.ts) - invaliderar registrations.all/events.detail/betalningar.all/activityLog.all. UI (368.3) kopplar bara en knapp.

Staging: deployad till pqtshyierkdgwdnxuirz via npx supabase functions deploy cancel-registration. Staging-test (7 fall, tests/api/cancel-registration.staging.test.ts) provar sakerhet/input/404/hela rundtripen pa ett eget create-registration-sentinel (avboka - 409 idempotent - aterta - 409 idempotent) inkl. Notering-append med bevarad fixtur-text och get-activity-log-verifiering av bada loggverben. Full sex-status-matrisen (AC1) bevisas UTTOMMANDE hermetiskt, inte live - motiverat i staging-testets filhuvud (samma skal som send-registration-confirmation.staging.test.ts: ingen EF kan konstruera Bekraftad/Betalningspaminnelse/Installt/Flytta-till-vantelista-fixturer utan att antingen mutera en permanent delad fixtur andra sviter beror pa, eller skriva forbi allowlisten).

Prod-deploy INTE utford (utanfor denna skivas scope; .prod-functions-allowlist.conf medvetet ororning). DoD-grindar: npm run typecheck 0 fel, npx biomejs biome check . 0 fel, node scripts/check-langa-streck.mjs OK 0 ofangade, npm run build gron, npm run test:api 1892 passed / 1 failed (den enda fallningen ar generate-event-attachment.staging.test.ts AC1-hash-testet, verifierat pre-existerande - samma fallning innan denna skivas kod deployades).
<!-- SECTION:NOTES:END -->
