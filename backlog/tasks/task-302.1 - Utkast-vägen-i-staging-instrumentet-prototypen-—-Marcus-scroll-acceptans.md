---
id: TASK-302.1
title: Utkast-vägen i staging-instrumentet + prototypen — Marcus scroll-acceptans
status: To Do
assignee: []
created_date: '2026-08-22 21:17'
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
- [ ] #1 laggUtkast skriver utkast/<eventId>/<typ>.pdf med upsert och returnerar signerad URL med SIGNED_DOWNLOAD_URL_TTL_SECONDS — andra anropet för samma event/typ skapar inget nytt objekt (API-test grönt mot staging)
- [ ] #2 test-docraptor-render med leverans:'utkast' svarar { url, utgar }; default-beteendet (bytes) oförändrat — befintliga anrop gröna
- [ ] #3 HEAD mot url ger 200, accept-ranges: bytes, content-type: application/pdf (mätt i testet, inte antaget)
- [ ] #4 useForhandsgranskaBilaga returnerar Storage-URL; prototypen öppnar den; inget blob: byggs längre på den vägen
- [ ] #5 Marcus bedömer scrollen i prototypen (staging) som likvärdig med http://-referensen — bokförs i sessionsdok med datum
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
