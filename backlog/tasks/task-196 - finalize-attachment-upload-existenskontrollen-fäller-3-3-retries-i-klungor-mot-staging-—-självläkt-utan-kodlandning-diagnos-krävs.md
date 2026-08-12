---
id: TASK-196
title: >-
  finalize-attachment-upload: existenskontrollen fäller 3/3 retries i klungor
  mot staging — självläkt utan kodlandning, diagnos krävs
status: Done
assignee: []
created_date: '2026-08-11 18:30'
updated_date: '2026-08-12 17:51'
labels: []
dependencies: []
priority: medium
ordinal: 361000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Belägg (rödklassningen 2026-08-11): tests/api/attachment-upload-large.staging.test.ts:145 fick 400 ('filen hittades inte i lagringen') i TRE post-merge-körningar på 45 min — runs 31426428636 (19:57Z), 31429376628 (20:33Z), 31430085028 (20:42Z), hard fail 3/3 retries varje gång. Grönt 21:23Z (31433516144) och 03:06Z (31454392944). Noll commits i fönstret mot finalize-attachment-upload, create-attachment-upload-ticket, _shared/attachments eller testfilen — testet självläkte. HYPOTES (EJ belagd, ska diagnosticeras — inte antas): eventual consistency i Supabase Storage-läsningen efter direkt-PUT, alternativt saknad retry i existenskontrollen. Klungmönstret (3 på 45 min, sedan tyst) är signaturen att förstå. Relaterat men EJ samma sak: task-183 (idempotensnyckel). Stängde issues #1148 + #1156 (+ #1154 delvis).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DIAGNOS (2026-08-12). Sekvenskarta: `create-attachment-upload-ticket` (service-role, deriverar `attachmentId=crypto.randomUUID()` + `path=eventId/attachmentId-filnamn`, `createSignedUploadUrl`) → klienten PUT:ar DIREKT mot signedUrl (ingen EF inblandad) → `finalize-attachment-upload` deriverar SAMMA path och körde (FÖRE denna ändring) en existenskontroll via `storage.list(eventId)` + manuellt `.find(name===expectedFilename)`, ingen retry (index.ts:106-108, kortets premiss verifierad korrekt).

HYPOTESPRÖVNING:
- Hypotes A (eventual consistency) — FALSIFIERAD. Rött-först-repro mot skarp staging (samma ticket→PUT→finalize-flöde testfilen använder, körd direkt via fetch mot staging-API:t med TEST_USER-JWT, ingen mail rörd): EN uppladdning, PUT→200, sedan finalize anropad 5 ggr mot SAMMA attachmentId/path med väntetider 0/1/3/8/16s (faktiskt t+1081/2001/4087/8951/16141ms) — samtliga 400 "hittades inte", identiskt fel, NOLL förbättring efter 16s. En genuin läs-efter-skriv-fördröjning hade läkt inom ms-till-få-sekunder, inte förblivit fel rakt igenom 16s. Docs-stöd: Supabase Storage-listning är en Postgres-query mot `storage.objects` (supabase.com/docs/guides/storage/production/scaling), och webhooks dispatchas EFTER db-commit — raden bör vara synlig för efterföljande queries omedelbart.
- Hypotes B (saknad retry) — delvis SANN (verifierat: ingen retry/backoff fanns) men OTILLRÄCKLIG som fix: eftersom felet inte är tidsberoende (se A) hade retry-med-backoff INTE löst det.
- Ny hypotes C (namngiven här, ersätter A som ledande förklaring): `storage.list(eventId)` kördes med bibliotekets DEFAULTS `limit:100, offset:0, sortBy:{column:'name',order:'asc'}` (verifierat i den faktiskt installerade `@supabase/storage-js@2.111.0`-källkoden, `StorageFileApi.ts` — `N={limit:100,offset:0,sortBy:{column:'name',order:'asc'}}`). BELAGGNING_EVENT_ID-mappen i bucketen "bilagor" ackumulerar OBEGRÄNSAT över tid: testfilens egen header ("Storage-bytesen rensas inte") + `.purge-staging-policy.json` purgar ENDAST Airtable-raden (target `upload-attachment-sentineler`/`generate-event-attachment-sentineler`, tabell Bilagor) — aldrig storage-objekten, och MINST 3 testfiler (`attachment-upload-large`, `upload-attachment`, `generate-event-attachment`) skriver till SAMMA delade event-mapp i varje CI-körning (push+nightly) sedan TASK-146.3/146.4. En nyuppladdad fils SLUMPMÄSSIGA UUID-prefix (attachmentId, crypto.randomUUID()) kan därför sortera utanför det 100-postersfönster `.list()` returnerar. Källor: github.com/supabase/storage/issues/9 ("Default limit for listObjects not working"), github.com/supabase/storage-js/issues/19 (limit tillämpas i "natural order" FÖRE sortering enligt rapportören — kan förklara varför ens `sortBy:name` inte garanterar att en ny post syns), github.com/supabase/supabase/issues/19994 (relaterad paginerings-överraskning). DIREKT REPRODUCERAD 2/2 ggr (0 medveten padding) mot skarp staging idag — se Belägg.
- EJ TALSATT: kunde inte räkna faktiskt antal objekt under `BELAGGNING_EVENT_ID/` (kräver SUPABASE_SERVICE_ROLE_KEY som agent-miljön saknar, TASK-201.11-klassen). Försök via anon+JWT: `storage/v1/object/list` gav 200 men 0 rader, och `storage/v1/object/info/` för ett KÄNT existerande objekt (Airtable-verifierat, `rec59mymUS5n47K8D`) gav 404 — RLS blockerar icke-service-role-läsning av denna PRIVATA bucket helt, så N kunde inte mätas oberoende. N>100 är alltså en stark, källbelagd men EJ RÄKNAD slutsats.
- Full-svit-vs-isolerat-signalen (201.1: 3x reproducerat i full-svit, 15/15 grönt isolerat) är RIKTNINGSKONSISTENT med hypotes C (github.com/supabase/storage-js#19: fler samtidiga skrivningar under full-svit ökar bruset i den "naturliga" pre-sorterings-ordningen `.list()` hämtar från) men den kausala kopplingen är INTE bevisad av mig — obekräftad delförklaring, flaggas öppet.
- Due diligence: `upload-attachment`/`generate-event-attachment`/`get-event-attachments`-EF:erna anropar INGEN `.list()`/`.info()`/`.exists()` (grep-verifierat) — samma buggmönster finns INTE där. `test-attachments-storage`s `.list()`-anrop opererar på ett FRISKT per-test-slumpat `ZZ-TEST-EVENT-<uuid>`-prefix som aldrig återanvänds/växer — inte sårbart på samma sätt.

BELÄGG (rött-först): två fristående diagnosskript kördes mot skarp staging 2026-08-12 (ingen mail rörd, samma sentinel-namngivning `ZZ-attachment-test-<uuid>.pdf` som produktionstestet, ej committade — låg i agentens scratchpad): (1) 0-padding repro: EN riktig ticket→PUT→finalize gav 400 direkt. (2) Timing-repro: 5 finalize-anrop mot SAMMA path med ökande delay, se Hypotes A. Båda lämnade föräldralösa (aldrig finaliserade) sentinel-storage-objekt under samma event-mapp — SAMMA typ av redan öppet bokförd avgränsning (storage-bytes städas aldrig), ingen ny skräpkategori.

FIX (implementerad, liten, samma fil kortet redan pekar ut): `supabase/functions/finalize-attachment-upload/index.ts` — existenskontrollen bytt från `storage.list(eventId)`+manuell `.find()` till `storage.info(path)` (enskild resurs-GET mot den redan server-deriverade `path`), strukturellt IMMUN mot mappstorlek/paginering oavsett N. Felklassning bytt från `listError` (kastade alltid 502) till `infoError.statusCode==='404'` (empiriskt verifierat rådataformat mot skarp staging: `{"statusCode":"404","error":"not_found","message":"Object not found","code":"NoSuchKey"}`; källkodsverifierat i `@supabase/storage-js/src/lib/common/fetch.ts` `handleError`: `error.status` blir ALLTID 400 (rå HTTP-kod) för alla storage-fel, `error.statusCode` bär den semantiska strängen — `.statusCode`, aldrig `.status`, är rätt fält att gren på).

VERIFIKATIONSGRÄNS (öppet bokförd, ej min att stänga): Edge Functions deployas INTE automatiskt (ADR-050: "Ingen deploy-automatik (manuell `supabase functions deploy`)"). Min kodändring kan därför INTE verifieras grön mot skarp staging från denna agent-session — CI:s `test:api:staging` testar den REDAN DEPLOYADE, oförändrade funktionen (bekräftat: lokal `npm run test:api` gav 656/656 grönt denna körning, INKLUSIVE den historiskt flakiga testen — förenligt med den probabilistiska hypotesen men INTE bevis i endera riktningen, eftersom staging-koden är opåverkad av min ändring). NÄSTA STEG (Marcus/orkestrerare): `supabase functions deploy finalize-attachment-upload --project-ref pqtshyierkdgwdnxuirz`, följt av upprepade körningar av `attachment-upload-large.staging.test.ts` (gärna ~10-20x) för att bekräfta att felfrekvensen faller mot noll.

LOKALA GRINDAR: typecheck 0 (exit 0), `npx @biomejs/biome check .` exit 0 (0 nya fynd i diffen — `supabase/functions` är exkluderat ur biome.json, "!supabase/functions", förväntat), build exit 0, `npm run test:api` 656/656 exit 0 (1m).

RELATION till task-183 (idempotensnyckel): oförändrad — diagnosen implicerar INTE idempotens-mekaniken, ett separat bekymmer.

STAGING-KVITTOT TAGET — ÖPPEN SKULD BETALD (orkestreraren, S105, 2026-08-12 kväll).

Fixen var landad som kod (commit d4328f01) men EF:en var ALDRIG DEPLOYAD — bokförd som öppen skuld sedan i morse, blockerad på en Supabase-access som visade sig finnas hela tiden (se TASK-201.11, stängt som falsifierat).

DEPLOY: npx supabase functions deploy finalize-attachment-upload --project-ref pqtshyierkdgwdnxuirz
  -> {"project_ref":"pqtshyierkdgwdnxuirz","functions":["finalize-attachment-upload"],"message":"Deployed Functions."}
Länkat projekt verifierat FÖRE deployen: staging linked=true, prod lvjsfnphlauldxqlncpl linked=false.

FÖRE/EFTER, matchat n=3 mot samma testfil:

FÖRE deployen (mätt av 201.3-agenten samma kväll, bokfört i dess slutrapport):
  3/3 RÖDA — full svit + två isolerade omkörningar. Symptomet hade dessutom
  SKIFTAT från 404 till 400 ("filen hittades inte i lagringen"), och testets
  tidigare dokumenterade egenskap "grön isolerat" höll INTE längre. Det är
  precis vad man väntar sig av rotorsaken: storage.list()-defaulten limit:100
  mot en obegränsat växande mapp blir deterministisk när mappen passerat 100.

EFTER deployen (mätt av orkestreraren):
  3/3 GRÖNA — PLAYWRIGHT_NO_WEB_SERVER=1 npx playwright test --project=api-staging
  tests/api/attachment-upload-large.staging.test.ts
  15 passed (18,5 s) / 15 passed (16,9 s) / 15 passed (20,3 s)

Rotorsaken (storage.list limit:100 + växande mapp, eventual-consistency-hypotesen
falsifierad rött-först) står oförändrad i diagnosen ovan. Det enda som saknades
var att koden faktiskt kom ut i miljön.

KVARSTÅR EJ I DENNA SKIVA: prod-deploy av samma fix. Prod-ref-låset (TASK-203)
gör det till ett Marcus-moment per beslut A (se TASK-201.9). Bokförs där, inte här.
<!-- SECTION:NOTES:END -->
