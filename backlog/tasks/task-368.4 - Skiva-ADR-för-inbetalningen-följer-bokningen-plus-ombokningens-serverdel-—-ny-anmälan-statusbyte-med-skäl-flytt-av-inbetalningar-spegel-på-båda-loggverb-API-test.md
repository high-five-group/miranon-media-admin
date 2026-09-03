---
id: TASK-368.4
title: >-
  Skiva: ADR för inbetalningen-följer-bokningen plus ombokningens serverdel — ny
  anmälan, statusbyte med skäl, flytt av inbetalningar, spegel på båda,
  loggverb, API-test
status: To Do
assignee: []
created_date: '2026-09-03 07:57'
updated_date: '2026-09-03 09:52'
labels:
  - ready-for-agent
dependencies:
  - TASK-368.2
parent_task_id: TASK-368
ordinal: 670000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beteende ände-till-ände: servern kan boka om en person från ett event till ett annat i en operation: den gamla anmälan blir avbokad med skälet ifyllt, en ny anmälan skapas, personens pengar följer med så att hon inte ser ut som obetald, kvittot står kvar som verifikation, och basens spegel stämmer på båda anmälningar. Beslutet att pengarna följer bokningen når ADR-baren (svårt att återställa i bokföringens koherens, överraskande utan kontext, verklig avvägning) och mintas här, aldrig inline. Täcker användarberättelser: 13, 14, 15, 17, 18.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 ADR mintad (nästa lediga nummer, README-raden i docs/decisions uppdaterad): inbetalningen följer bokningen vid ombokning; kvittot rörs aldrig (kvitton kan strukturellt inte pekas om); flytten är en rättelse av bokföringspost (BFL 5 kap. 5 §) med spårbarhet i aktivitetsloggen; prisskillnad bokförs som mellanskillnad via befintlig tilläggs-/kreditmekanik; alternativen kreditera-allt-och-nytt samt ersättande kvitto förkastade med skäl ur docs/research/kvitto-vid-ombokning-2026-09-03.md
- [x] #2 Ombokningsoperationen: skapar ny anmälan på valt event via befintlig skapa-anmälan (källa Manuell, samma person), sätter den gamla till Avbokad/Ombokad med Notering-rad '[Ombokad ÅÅÅÅ-MM-DD av <aktör>] till <event, datum>', flyttar alla AKTIVA inbetalningar till den nya anmälan (raden byter anmälan, ögonblicksbild av event och eventdatum uppdateras på raden, kvitto_id och kvittoraden orörda), räknar om spegeln på BÅDA anmälningar, och loggar 'bokade om anmälan' med båda anmälningarna i statementet
- [x] #3 Svaret bär prisskillnaden (nytt pris minus flyttad summa, eller null när pris saknas) så klienten kan visa den; makulerade inbetalningar flyttas inte
- [x] #4 Fel halvvägs lämnar inget halvt läge: ordningen är ny anmälan, flytt i Postgres, statusbyte, spegel; misslyckas ett steg rapporteras exakt vilket, och ett omanrop är idempotent (ingen dubbel anmälan, ingen dubbel flytt)
- [x] #5 API-test mot staging-funktionen prövar flytten med en och flera inbetalningar, spegel på båda anmälningar, prisskillnad positiv/negativ/null, att makulerade rader inte flyttas, idempotens och loggverbet; allowlist-vakten och DoD-grindarna gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ADR-130 mintad (docs/decisions/ADR-130-inbetalningen-foljer-bokningen-vid-ombokning.md): inbetalningen foljer bokningen, kvittot rors aldrig (kolumn-scopad UPDATE-grant pa kvitton - databasgaranti, inte konvention), flytten ar en rattelse av bokforingspost BFL 5 kap 5 § med tva spar (aktivitetsloggen + Notering-raden), prisskillnad bokfors som MELLANSKILLNAD via befintlig mekanik men aldrig automatiskt av ombokningen. Fyra alternativ forkastade med skal ur docs/research/kvitto-vid-ombokning-2026-09-03.md. README-raden i docs/decisions/README.md + rot-READMEs ADR-rakning 128 -> 129 i samma commit.

EF-form: EGEN EF rebook-registration, INTE ett tredje atgard-varde pa cancel-registration. Motivering i EF:ens filhuvud: repots betalningsdoman drar redan gransen vid om operationen SKAPAR nagot (registrera-inbetalning vs hantera-inbetalning); ombokningen skapar en anmalan, ror Postgres, speglar tva anmalningar och svarar med ett annat innehall - plus att cancel-registration ar staging-deployad och pa vag till prod i leverans 1, sa blast-radien halls isar.

Ren modul _shared/rebook-registration.ts (beslutaOmbokning, byggOmbokningsrad, byggFlyttadOgonblicksbild, summeraFlyttat) - Deno-fri, aterianvander cancel-registrations overgangstabell i stallet for en andra kopia. Hermetisk svit tests/api/rebook-registration.test.ts: 40 fall grona.

Skapa-karnan bruten ur create-registration till _shared/create-registration.ts (hamtaEventNyckel / sokBefintligAnmalan / skapaAnmalanRad / skapaAnmalan) - ren flytt, samma anrop, samma ordning, samma loggrader, samma statuskoder. create-registrations yttre kontrakt oforandrat. Uppdelningen i tre steg behovs for att ombokningen ska kunna FRAGA om mal-anmalan finns innan den beslutar, utan att gora eventuppslag + dubblettfraga tva ganger.

Idempotensnyckel: server-sida fakta (gamla anmalans status + affars-unikheten e-post x EventKey pa mal-eventet). INTE en Idempotency-Key (create-registration lagrar den bevisligen inte) och INTE Notering-raden (Lotta far redigera den i basen). Ett andra anrop ger aterupptaget: true, noll flyttade rader, ingen statusskrivning, ingen loggrad. En avbruten korning kan koras klart genom adoption av den redan skapade raden (nyAnmalanSkapad: false).

Allowlist: ny post rebook-registration (Anmalningar: Status + Notering) - egen nyckel, inte aterbruk av cancel-registrations. Nya anmalan skrivs via create-registration-postens egna falt. Loggverb ANMALAN_VERB.bokadeOm + NY_ANMALAN_EXTENSION_IRI i _shared/aktivitetslogg.ts (byggStatement fick ett frivilligt extraExtensions-falt, additivt - befintliga anropare oforandrade).

MIGRATION: NEJ. service_role har redan table-level UPDATE pa inbetalningar (migration 20260830195728 § 4), sa anmalan_record_id ar skrivbar. Verifierat SKARPT mot staging: flytten gick igenom i bada riktningarna i staging-testet, inte antaget ur migrationstexten. Runbooken lamnad ororing (ingen migration att bokfora).

Klient: RebookRegistration.schema.ts, DataSourceAdapter.bokaOmAnmalan (AirtableAdapter implementerar, SupabaseAdapter NOT_IMPLEMENTED-stub), mutation useBokaOmAnmalan (src/data/mutations/registrationRebooking.ts) - invaliderar registrations.all, events.detail for BADA event, betalningar.all, activityLog.all. 368.5 kopplar bara UI.

Staging: rebook-registration deployad till pqtshyierkdgwdnxuirz, create-registration omdeployad (skrivkarnan flyttad). Staging-test tests/api/rebook-registration.staging.test.ts: 9 fall grona - sakerhet/input/404/409 samma_event, flera inbetalningar (tva aktiva + en makulerad som INTE flyttades), spegel iFas pa BADA anmalningar via hamta-inbetalningar, ogonblicksbild pekad om till mal-eventet, kvittoId null, prisskillnadens identitet, idempotens (aterupptaget), loggverbet med bada anmalningarna, samt en inbetalning i motsatt riktning.

Prisskillnadens TRE TECKEN (positiv/negativ/null) bevisas HERMETISKT, inte i staging: ingen befintlig EF kan satta mal-eventets pris (create-events allowlist bar inget prisfalt) och Avtalat pris satts bara pa en anmalan som redan finns. Staging bevisar identiteten i stallet. Samma delning som cancel-registration.staging.test.ts gor for sex-status-matrisen.

Postgres-stadning: staging-testet raderar sina egna inbetalningar via hantera-inbetalning (atgard radera) i finally. Skalet: purge-sentinelns falt ar inbetalningar.ogonblicksbild_namn, som fylls ur anmalans namn (Fornamn Efternamn, med mellanslag) och darfor strukturellt aldrig kan matcha regexen for ZZ-TASK-346-sentinelerna. Att vidga purge-monstret hade andrat en delad stadningsmekanism i en skiva om ombokning.

tsconfig.edge-shared.json utokad med cancel-registration.ts + rebook-registration.ts (bada transitivt Deno-fria) - tackningen var tidigare bara en sidoeffekt av att tester rakade importera dem.

DoD-grindarna kordes var for sig med exitkoden last direkt fran skalet, aldrig genom en pipe (L440): typecheck 0, biome 0, check-langa-streck 0 med noll ofangade, build 0, check:docs 0 med 14 grona, api-sviten 1946 passerade och 2 foll. De tva fallningarna: den kanda flaken generate-event-attachment.staging.test.ts, samt en 30-sekunders-timeout i send-registration-confirmation.staging.test.ts som sammanfoll med att en post-merge-korning tog staging mitt i sviten (staging-semaforen bekraftade CI-lasningen direkt efterat).
<!-- SECTION:NOTES:END -->
