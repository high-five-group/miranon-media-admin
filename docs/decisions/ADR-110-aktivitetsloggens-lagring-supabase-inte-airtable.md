# ADR-110: Aktivitetsloggens lagringsyta — Supabase `activity_log`, inte Airtable

- **Status:** Accepted
- **Datum:** 2026-08-11
- **Fas:** 6.5

## Kontext

PRD `TASK-201` (Aktivitetslogg, xAPI) behöver en lagringsyta för loggposter som
föds av var och en av ~11 befintliga mutationer (betalning, anmälan, närvaro,
person, event, mail, kvitto — S105 Del 2 beslut 2). Ursprungsplanen i
`byggplan.md` § Fas 6.5 (skriven 2026-05-05, P3a) och
`docs/features/FEATURE-ACTIVITY-LOG.md` (2026-04-05) föreslog en Airtable-tabell
"Aktivitetslogg" med en uttalad "Framtida Supabase-version" som eventuell
efterträdare.

[ADR-063](ADR-063-airtable-bas-som-forstklassig-leverabel.md) (2026-06-25)
etablerade sedan Airtable-basen som **förstklassig leverabel** — resolution av
databrister sker I basen, inte genom att routa runt den, och Supabase-migration
är ett separat SENARE spår (Beslut 6), inte en ersättning. Frågan grillades
explicit i S105 Del 2 (2026-08-11,
`tasks/sessions/archive/2026-08/2026-08-11-session-105.md`): ska aktivitetsloggen följa
Airtable-planen från 2026-04/2026-05, eller gå direkt till Supabase?

## Beslut

Aktivitetsloggen lagras i Supabase-tabellen `activity_log` — i BÅDA miljöerna
(staging + prod, byggs av `TASK-201.2`) — **inte** i Airtable. Write sker
endast via `service_role` i en Edge Function (`TASK-201.3`); RLS är aktiv med
deny-all för `anon`/`authenticated` (se migrationsfilen,
`supabase/migrations/20260811211759_create_activity_log.sql`, `TASK-201.1`).

Marcus, ordagrant (S105 Del 2 beslut 3): *"Absolut, utan tvekan. Inte alls
viktigt att ha med detta i Airtable så Supabase blir perfekt."*

Skälen, mätta:

1. **Append-only-volymen mot Airtables radtak.** Grov uppskattning ~11
   mutationstyper × Lottas/Rogers dagliga användning ⇒ 20 000–70 000
   loggrader/år (S105 Del 2). Airtable-basens radtak gör en evigt växande,
   aldrig-raderad logg (FEATURE-dokens egen öppna fråga #2 redan 2026-04:
   *"Hur länge sparas loggen? Förslag: allt sparas. Ingen radering."*) till en
   strukturell risk mot BEFINTLIG data i samma bas — inte bara mot loggen
   själv.
2. **Enklare skrivväg.** En `insert` mot Postgres i EF:ns efterspel, i stället
   för ett Airtable-API-anrop (rate-limit 5 anrop/sekund per bas, delad med
   alla andra klienter mot samma bas — ADR-063 S91-not) mitt i varenda
   mutations write-path.
3. **Migrationsmotivet (Fas E).** FEATURE-ACTIVITY-LOG.md § "Framtida
   Supabase-version" förutsåg redan formen (*"Samma modell, men som
   `activity_log`-tabell... Inga ändringar i adapter-interfacet"*) — S105
   väljer att inte bygga en Airtable-mellanstation som ändå måste migreras.
4. **RLS + service-role write** ger en striktare skrivgrind än Airtable-API:t
   kan uttrycka: deny-all för `anon`/`authenticated`, write endast via
   `service_role` i EF.

### Relationen till ADR-063 — bokförd, avsiktlig avgränsning, inte en tyst motsägelse

ADR-063 Beslut 1–3 gäller Airtable-basens BEFINTLIGA data och
app↔Airtable-interaktioner — resolution av brister sker I basen, som
leverabel/mall. `activity_log` är INTE en Airtable-brist som routas runt: den
har ALDRIG legat i Airtable, och detta beslut flyttar ingenting UT ur basen.
Det är en medveten, avgränsad ADR-063-avvikelse för NY, systemgenererad
telemetri (jfr `TASK-201` § ADR-koppling: *"medveten bokförd avvikelse för
systemdata"*) — parallell till hur Beslut 6 redan höll dörren öppen för ett
separat Supabase-spår utan att det utgör "route-around" av befintlig data.

### AT-Max-konsekvens (byggplan.md-amendering, samma landning)

`byggplan.md` § Milstolpe — Airtable-bas-maximering antog att Fas 6.5:s
`Activity Log`-write skulle vara "sista Airtable-interaktionen" innan
interaktions-registret är moget för audit (tre förekomster av premissen:
fas-tabellraden, milstolpe-blockets inledning, Beroenden-listan). Med detta
beslut tillför Fas 6.5 **ingen** Airtable-interaktion — milstolpens "hela
app↔Airtable-interaktions-ytan är byggd"-villkor uppfylls redan av Fas 6
ensamt. `byggplan.md` amenderas öppet i denna landning (`TASK-201.1` AC #3) —
se `byggplan.md` § 6. Versionshistorik för exakt diff (version 1.15).

## Alternativ som övervägdes

1. **Airtable `Activity Log`-tabell (ursprungsplanen, byggplan.md 2026-05-05 +
   FEATURE-ACTIVITY-LOG.md 2026-04-05).** Avvisat: löser inte volymrisken,
   kräver en senare migrering ändå (FEATURE-dokens egen "framtida
   Supabase-version" bekräftar att detta alltid var en mellanstation), och
   belastar den delade rate-budgeten (5 anrop/s) med append-only-skrivningar
   som aldrig behöver Airtables funktioner (kopplingar, vyer, formulär) —
   loggen konsumeras uteslutande av appens egna vyer.
2. **Vänta med lagringsbeslut till Fas E (fullständig Supabase-migration).**
   Avvisat: Fas E:s horisont är omankrad och öppen ("aktualiseras när appens
   sidor är klara", S91 premiss 4) — att blockera en dag-1-prioriterad
   Lotta-feature (förtroendemotivet, PRD § Problemformulering) på en odaterad
   framtida milstolpe är fel avvägning; `activity_log` kräver ingen av de
   andra Fas-E-tabellerna för att fungera isolerat.
3. **Extern lagring (tredjeparts logg-tjänst).** Ej seriöst övervägt:
   introducerar en ny leverantör, nytt auth-flöde och ny kostnadsrad för data
   som redan har en Postgres-instans (Supabase, redan i drift för Auth)
   tillgänglig inom befintlig plan.

## Konsekvenser

**Positiva:** loggens append-only-volym hotar aldrig Airtables radtak eller
rate-budget; skrivvägen blir en enkel `insert` i EF:ns efterspel; RLS ger en
striktare skrivgrind än Airtable-API:t kan uttrycka; formen speglar
FEATURE-dokens egen ursprungliga framtidsplan, så inget tidigare arbete kastas.
AT-Max-milstolpens scope krymper (Fas 6.5 tillför noll nya
app↔Airtable-interaktioner att audita).

**Negativa/skuld:** aktivitetsloggen blir den FÖRSTA Postgres-tabellen i
projektet (`TASK-201.1` etablerar `supabase/migrations/`-mekanismen från
grunden — ingen befintlig deklarativ migrations-precedent i repot; Supabase
CLI-standarden följs i stället för `create-*-table.mjs`-Airtable-mönstret);
två datakällor (Airtable + Supabase Postgres) lever nu parallellt i
produktion före Fas E, vilket kräver att appens datalager (lager-oberoende-
principen) exponerar båda via sina respektive adaptrar utan att blanda ihop
dem call-site-vis.

## Relaterat

- [ADR-063](ADR-063-airtable-bas-som-forstklassig-leverabel.md) — Airtable
  som förstklassig leverabel; denna ADR bokför den avgränsade avvikelsen för
  systemdata.
- [ADR-111](ADR-111-requestid-enda-korrelations-id-ingen-trace-id.md) —
  korrelations-ID:t (`requestId`) som bärs i varje `activity_log`-rads
  `context.extensions`.
- `docs/features/FEATURE-ACTIVITY-LOG.md` § "Framtida Supabase-version" —
  formen denna ADR realiserar.
- `tasks/sessions/archive/2026-08/2026-08-11-session-105.md` § Del 2 Beslut 3 — grillad
  samsyn, Marcus-kvittens.
- `byggplan.md` § Fas 6.5 + § Milstolpe — Airtable-bas-maximering —
  amenderade i samma landning (`TASK-201.1`).
