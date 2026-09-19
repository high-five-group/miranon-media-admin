---
id: TASK-459
title: >-
  Fynd: get-events/get-registrations saknar per-steg-tidsloggning — mätpass
  tvingas gissa kallstart/auth/Airtable-sidor från extern väggtid
status: To Do
assignee: []
created_date: '2026-09-18 11:10'
updated_date: '2026-09-19 09:24'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 798000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
task-451.6 (docs/research/startvarmningen-batch1-kall-latens-2026-09-18.md) mätte get-events/get-registrations enbart som EN extern väggtid per anrop (curl mot deployad EF) — koden loggar inga steg (verifierat: grep 'console\.|performance.now|Date.now' i get-events/index.ts, get-registrations/index.ts, _shared/airtable-client.ts, _shared/eventpris.ts, _shared/registration-read.ts, _shared/errors.ts gav noll timing-träffar, bara errors.ts:110/112 console.info/error vid FEL). Följden: kallstart (Deno-isolat-boot), auth (requireUser → supabase.auth.getUser()), varje Airtable-sidas svarstid och serialiseringen kan inte särskiljas utan extern gissning. Samma slutsats gäller sannolikt fler get-*-EF:er (samma _shared/airtable-client.ts-kärna). Bygg INTE i detta kort — endast instrumentering, ingen beteendeändring.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 get-events och get-registrations loggar (console.info, strukturerad JSON likt errors.ts:110) minst: auth-tid (requireUser), varje Airtable-anrops varaktighet (kan bo i airtable-client.ts centralt så alla anropare ärver det gratis), och total handler-tid
- [ ] #2 Loggformen är sökbar i Supabase Logs Explorer (function_edge_logs, metadata.execution_time_ms) utan att kräva en ny extern mätrigg
- [x] #3 Ingen beteendeändring i svaret — enhetstesterna (tests/api) oförändrat gröna
- [x] #4 Dokumenterat i EF-header/docblock varför loggningen finns (så nästa mätpass hittar den utan att söka)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
SKÄRPNING (orkestrerarens uppdrag, utöver kortets AC): utöver AC #1:s
duration-loggning per Airtable-anrop loggar `_shared/airtable-retry.ts` nu
EXPLICIT varje 429-svar (`airtable_429_retry`: helper/tabell, försök-nr,
vald backoff i ms) och en avslutande `airtable_429_exhausted`-rad när taket
är uttömt. Injicerad `logContext`/`log` (default `console.warn(JSON.
stringify(...))`), modulen förblir Deno-fri. Central placering
(`callAirtableWithTiming` i `airtable-client.ts`) — get-events,
get-registrations och alla FRAMTIDA get-*-EF:er som delar denna kärna
ärver båda logg-typerna gratis. 7 nya rött-först-fall i
`tests/api/airtable-retry.test.ts`.

AC #1 — bevis: (a) kodläsning — get-events/get-registrations beräknar
authMs/totalMs på VARJE returväg (lyckad + felväg via mapErrorToResponse-
context), airtable-client.ts's callAirtableWithTiming loggar durationMs per
faktiskt Airtable-HTTP-anrop (ärvs av fetchFromAirtable/fetchAirtablePage/
fetchAirtableRecord). (b) rött-först: 17/17 fall gröna i
tests/api/airtable-retry.test.ts (10 befintliga + 7 nya); 6 av de 7 nya
föll mot den OFÖRÄNDRADE (pre-PR) koden (verifierat: skrev tillbaka origin/
main-versionen av airtable-retry.ts, körde om sviten — 6 failed/11 passed
— återställde sedan). (c) verklig staging-invokering EFTER deploy (se
nedan): 200 OK på båda EF:erna, ingen kastad exception — dvs loggraderna
exekverade utan fel i den skarpa Deno-runtimen (Node-tester kan inte
importera airtable-client.ts, se dess egen docblock — det är den enda
runtime-nära bekräftelse som är möjlig utan Logs-åtkomst).

AC #2 — INTE oberoende verifierad. Deployat till staging
(pqtshyierkdgwdnxuirz, `supabase functions deploy get-events/get-
registrations --use-api`) och invokerat på riktigt (get-events 200,
23 events; get-registrations 200, 90 registreringar — TEST_USER-login via
Supabase Auth REST, samma mönster som tests/api/helpers.ts). Kunde INTE
sedan söka i loggarna för att bekräfta att raderna syns, av TRE oberoende
skäl (var för sig tillräckligt): (1) scripts/deny-hemlighet-utskrift.sh
(TASK-203) nekar mekaniskt varje kommando som extraherar Supabase-PAT:ets
råvärde (krävs för Management API/Logs-frågor) — verifierat att hooken är
registrerad i .claude/settings.json. (2) `supabase` CLI 2.117.0 (nyare än
research-passets 2.75.0) saknar ALLTJÄMT en `functions logs`-subkommando
(verifierat: `functions --help`). (3) Supabase Dashboard kräver Marcus egen
inloggning — provat LIVE 2026-09-19 via chrome-devtools: /dashboard/
projects redirectar till /dashboard/sign-in, ingen aktiv session.
PR-kroppen bär en körbar mätanvisning byggd på Supabase EGNA verifierade
frågeexempel (WebFetch mot supabase.com/docs 2026-09-19, inte gissade).

VIKTIG DIVERGENS mot AC #2:s parentes "(function_edge_logs, metadata.
execution_time_ms)": den källan/de fälten är Supabase EGEN AUTOMATISKA
per-invokerings-metadata (kräver ingen kod från oss). Mina console.info/
warn-JSON-rader landar i KÄLLAN `function_logs` (konsol-utdata från
funktionen), sökbart via `event_message` i samma unifierade `logs`-tabell
(`source`-kolumnen skiljer dem åt — verifierat mot supabase.com/docs/guides/
observability/log-field-reference 2026-09-19). AC #2:s krav ("sökbar i Logs
Explorer") håller ändå — bara inte i den EXAKTA tabell/fält-kombination
parentesen nämner. Flaggat här eftersom en agent inte kunde stänga frågan
själv; Marcus kan bekräfta på under en minut med PR-kroppens mätanvisning.

#2550-KOMPATIBILITET, MEKANISKT VERIFIERAD (inte bara läst): `git
merge-tree --write-tree` mellan denna PR:s träd och task/458-get-events-
chunk-parallelliserings HEAD (bas: deras gemensamma merge-base), exit 0,
INGEN konflikt. Resulterande träd inspekterat: get-events/index.ts bär
BÅDA ändringarna korrekt sammanslagna (min docblock + Deno.serve-timing;
#2550:s withConcurrencyLimit-import + BOR_OVER_CHUNK_CONCURRENCY +
fetchByRecordIds-omskrivning). Denna PR rör ENDAST Deno.serve-handlern
(handlerStart/authStart/authMs, ef_step_timing-loggen) och en docblock
direkt efter import-blocket — #2550 rör fetchByRecordIds-loopen och en ny
const längre ner. Disjunkta ytor.
<!-- SECTION:NOTES:END -->
