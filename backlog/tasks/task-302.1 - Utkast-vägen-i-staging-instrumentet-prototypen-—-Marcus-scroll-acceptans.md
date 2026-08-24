---
id: TASK-302.1
title: Utkast-vägen i staging-instrumentet + prototypen — Marcus scroll-acceptans
status: Done
assignee: []
created_date: '2026-08-22 21:17'
updated_date: '2026-08-24 13:06'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-302
priority: high
ordinal: 553000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Skiva 1 av `TASK-302`. Läs förälderns designbeslut FÖRST — de binder. Denna skiva är ENHETENS ACCEPTANSGRIND: Marcus ska kunna känna scrollen i prototypen innan de skarpa EF:erna rörs.

## Bygg

1. `supabase/functions/_shared/utkast.ts` — `laggUtkast(supabaseAdmin, { eventId, typ, bytes }) → { url, utgar }`: upload till `utkast/<eventId>/<typ>.pdf` i `BILAGOR_BUCKET_ID` med `contentType: 'application/pdf'`, `upsert: true`; `createSignedUrl(path, SIGNED_DOWNLOAD_URL_TTL_SECONDS)`; `utgar` = ISO-tid. Återanvänd `_shared/attachments.ts`s konstanter och mönstret i `upload-attachment`/`get-attachment-download-url` — skriv ingen ny TTL, ingen ny bucket. Sökvägen valideras (eventId mot `rec`-form, `typ` mot enum) — ingen path-injektion.
2. `supabase/functions/test-docraptor-render/index.ts` (staging-only mätinstrument, `ADR-119` beslut 7): nytt valfritt request-fält `leverans: 'bytes' | 'utkast'` (default `bytes`, oförändrat beteende). Med `utkast` krävs `eventId` + `typ`; svaret är JSON `{ url, utgar }` i stället för PDF-bytes. Filhuvudet uppdateras: instrumentet bär nu BÅDA leveransvägarna, och varför.
3. Adapter-interfacet `renderPdfFranHtml` (`DataSourceAdapter.ts`, `SupabaseAdapter.ts`, `AirtableAdapter.ts`): lägg till `renderPdfTillUtkast(html, namn, { eventId, typ }) → { url, utgar }` (behåll `renderPdfFranHtml` tills skiva 2 — riv inte).
4. `src/data/mutations/useForhandsgranskaBilaga.ts`: mutationen returnerar `{ url, utgar, saknade }` där `url` är Storage-URL:en; docblockens blob-resonemang (revoke-stycket) ersätts med varför URL:en är serverad av nätverkstjänsten (`ADR-124`). Prototypytan öppnar URL:en exakt som i dag (automatisk öppning + knapp-fallback, Del 10 § E) — ingen UX-ändring.
5. Minimaltest (CLAUDE.md: minimalt test före full implementation): ett API-test mot staging som anropar `test-docraptor-render` med `leverans: 'utkast'` på en liten HTML och verifierar `HEAD url` → 200 + `accept-ranges: bytes` + `content-type: application/pdf`, och att ett andra anrop för samma event/typ INTE skapar ett andra objekt (upsert).
6. Deploya `test-docraptor-render` till STAGING (aldrig prod; verifiera `supabase/.temp/project-ref` mot staging före deploy — se `docs/research/docraptor-minimaltest-2026-08-22.md` § hur).

## Acceptans (AC)

Se --ac. Marcus-momentet är sist: dev-server mot staging (port 5174 ägs av en befintlig process — använd en annan port eller återanvänd den om den är denna sessions), öppna förhandsgranskningen i prototypen, scrolla. Likvärdig med `http://`-referensen ⇒ skiva 2 plockas. Annars STOPP — då är hypotesen att Storage-URL:en beter sig som arm A falsifierad och enheten går tillbaka till Marcus.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 laggUtkast skriver utkast/<eventId>/<typ>.pdf med upsert och returnerar signerad URL med SIGNED_DOWNLOAD_URL_TTL_SECONDS — andra anropet för samma event/typ skapar inget nytt objekt (API-test grönt mot staging)
- [x] #2 test-docraptor-render med leverans:'utkast' svarar { url, utgar }; default-beteendet (bytes) oförändrat — befintliga anrop gröna
- [x] #3 HEAD mot url ger 200, accept-ranges: bytes, content-type: application/pdf (mätt i testet, inte antaget)
- [x] #4 useForhandsgranskaBilaga returnerar Storage-URL; prototypen öppnar den; inget blob: byggs längre på den vägen
- [x] #5 Marcus bedömer scrollen i prototypen (staging) som likvärdig med http://-referensen — bokförs i sessionsdok med datum
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC#1 mätt (staging, test-docraptor-render v8, deployad denna skiva): laggUtkast (_shared/utkast.ts) skriver utkast/<eventId>/<typ>.pdf i BILAGOR_BUCKET_ID med upsert:true, signerar med SIGNED_DOWNLOAD_URL_TTL_SECONDS (300s). tests/api/test-docraptor-render-utkast.staging.test.ts 'allow'-testet bevisar upsert genom att jämföra pathname (new URL(url).pathname) mellan två anrop för SAMMA eventId+typ men OLIKA html-innehåll: identisk path. Grönt: 6/6 nya tester (20.0s), test:api totalt 1037 passed / 0 failed.

AC#2 mätt: leverans:'utkast' svarar 200 { url, utgar } (UtkastResultatSchema.parse). Regressionstest 'leverans utelämnad (default bytes)' bevisar oförändrat rå application/pdf-svar — grönt.

AC#3 mätt, EJ antaget: fristående curl+node-HEAD mot en riktigt genererad signerad URL (denna session, eventId=BELAGGNING_EVENT_ID/recIFrxHZw165ycXk, typ=bilaga) gav verbatim: status 200, accept-ranges: bytes, content-type: application/pdf, content-length: 32141. Samma tre fält asserteras även i testfilens HEAD-anrop (två gånger, en per upsert-anrop).

AC#4: DataSourceAdapter.renderPdfTillUtkast (ny metod, renderPdfFranHtml BEHÅLLEN oförändrad) implementerad i AirtableAdapter (postEdgeFunction+UtkastResultatSchema.parse) och SupabaseAdapter (NOT_IMPLEMENTED-stub). useForhandsgranskaBilaga.ts returnerar nu { url, utgar, saknade } från renderPdfTillUtkast i stället för URL.createObjectURL(blob). GenereringsPrototyp.tsx skickar eventId+typ (MALL_TILL_UTKAST_TYP-mapping) till mutationen; window.open(url) och knapp-fallback OFÖRÄNDRADE (samma kod, url pekar nu på Storage i stället för blob:). AVVIKELSE bokförd i slutrapporten: ARBOGA-fixturens id ändrat från 'proto-event-59' till den riktiga rec-formen 'recqA2Us1FByBnibz' (redan dokumenterad i intilliggande kommentar) — krävdes för att klara isValidEventId-valideringen; ingen annan kodplats berodde på den gamla formen.

AC #5 — Marcus scroll-acceptans BOKFÖRD 2026-08-23 (~00:30): *"Jag har testat nu, det funkar som A, inga problem med scrollningen."* Staging, prototypen (`/mer/dokument?variant=a&vy=generering&mall=bekraftelse`), Förhandsgranska först → 8,4 s → Storage-URL i ny flik. Orkestreraren verifierade kedjan headed själv före överlämning (skärmdumpar i sessionens scratchpad). Två fällor på vägen, båda orkestrerarens: dev-servern startades på `127.0.0.1:5176` som inte är i `CORS_ALLOWED_ORIGINS` (preflight-mätt: `localhost:5173/5174/5175/4173` → 200, allt annat 403) → "Failed to fetch"; och navigationsanvisning gavs ur kod i stället för ur skärm. Servern flyttades till `localhost:4173`. Landad `#1833` → `1a09601e`. Stängd av orkestreraren efter CI-verifiering.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
S112 bokföringspass (2026-08-24): PR #1833, merge-commit 1a09601e, MERGED 2026-08-22T22:12:05Z, samtliga checks SUCCESS. Filer scopade uteslutande till utkast-leveransvägen (adaptrar, EF, mutation, schema, staging-test). Samtliga 4 DoD bockade mot detta.
<!-- SECTION:FINAL_SUMMARY:END -->
