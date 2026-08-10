---
id: TASK-146.4
title: 'Skiva: Adapter-ytan och uppladdnings-funktionen i båda mönstren'
status: Done
assignee: []
created_date: '2026-08-07 09:06'
updated_date: '2026-08-10 10:04'
labels:
  - ready-for-agent
dependencies:
  - TASK-146.2
  - TASK-146.3
parent_task_id: TASK-146
ordinal: 243000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
En fil kan laddas upp och kopplas till sitt event, och den vägen håller lager-oberoendet: allt går via adapterkontraktet, aldrig direkt mot lagringen. Stora filer laddas upp utan att appen hänger sig.

MÖNSTER 2 HÅLLER ADR-057 trots att klienten rör lagringen, eftersom auktorisationsbeslutet — vem får ladda upp vad, till vilken path — fortfarande fattas server-side.

Täcker användarberättelser: 1, 2, 10, 11, 14, 15, 16, 18
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Bilage-metoderna finns på datakälle-adapterns kontrakt och implementeras av BÅDA adaptrarna (port-paritet)
- [x] #2 UI-lagret importerar aldrig lagrings-SDK:t och anropar aldrig lagrings-API:t direkt; frånvaron är mekaniskt fälld
- [x] #3 Mönster 1 (små filer): bytesen går genom edge-funktionen, som skriver dem med förhöjd behörighet plus en metadatarad
- [x] #4 Mönster 2 (stora filer): funktionen utfärdar ett tidsbegränsat, path-scopat uppladdnings-tillstånd; klienten laddar upp direkt utan att bytesen passerar funktionen
- [x] #5 Auktorisationsbeslutet fattas server-side i BÅDA mönstren — klienten får ett scopat tillstånd, aldrig en genväg runt adaptern
- [x] #6 En misslyckad uppladdning ger ett fel som säger vad som gick fel, på Lottas språk och inte i byte
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PREMISS-PASS (ADR-086) — mätt före design: (1) Bilagor-tabellen (staging apphjj8Q7lkXCMsL4, tblFamrna53MVf1nG) verifierad LIVE via Airtable MCP describe_table — fälten Namn/'Storlek (bytes)'/Event/Skapad matchar EXAKT scripts/create-bilagor-table.mjs CONFIG.fields, ingen divergens. (2) Bucket "bilagor" verifierad LIVE via en transient service-role-curl mot Storage-API:t (nyckeln levde bara i processens env, aldrig disk): public=false, file_size_limit=26214400, allowed_mime_types=['application/pdf'] — matchar scripts/provision-attachments-bucket.mjs exakt. Inga divergenser.

FÖRSTA STEGET, EMPIRISKT STÄNGT (PRD:s uttryckliga öppna lucka): createSignedUploadUrl:s TTL var av forskningspasset flaggad som "svagare belagd... ska verifieras vid bygget". Verifierat 2026-08-10 mot staging: ett riktigt anrop gav en JWT-token med iat/exp-diff = EXAKT 7200 sekunder (2h) — matchar dessutom @supabase/storage-js:s egen JSDoc ("They are valid for 2 hours"). Konstanten SIGNED_UPLOAD_URL_TTL_SECONDS=7200 i supabase/functions/_shared/attachments.ts bär källan.

ARKITEKTUR: EN adapter-metod (uploadAttachment) döljer BÅDA mönstren — anroparen (framtida bilageväljaren, task-147.5) vet aldrig vilket mönster som kördes. Adaptern väljer mönster ur file.size mot SMALL_UPLOAD_MAX_BYTES (6 MB, forskningspassets TUS-tröskel-rekommendation). Mönster 1: base64 i EF-body (upload-attachment). Mönster 2: create-attachment-upload-ticket (utfärdar server-deriverad path+attachmentId+signerat token) -> RIKTIG direkt PUT mot Storage via redan-instansierade `supabase`-klienten (ingen ny SDK-import, samma singleton som redan bär auth-sessionen) -> finalize-attachment-upload (verifierar objektet FAKTISKT finns på den server-deriverade platsen innan en metadatarad skrivs, läser storleken från lagringens FAKTISKA metadata — aldrig ett klient-påstått tal).

SÄKERHETSDESIGN (AC #5): path/attachmentId är ALLTID server-genererade (crypto.randomUUID()), aldrig klient-valda. En klient kan därför inte peka finalize mot en annan händelses fil — den kan bara "träffa" en path som den SJÄLV fick ett scopat tillstånd för OCH faktiskt laddade upp bytes till (bevisat negativt: finalize med ett aldrig-uppladdat attachmentId -> 400).

MEKANISK LAGER-OBEROENDE-GRIND (AC #2, DoD #6): tests/api/attachment-layer-independence.test.ts. Smalt mot Supabase STORAGE-ytan specifikt (.storage.from/createSignedUploadUrl/uploadToSignedUrl/storage-v1-object) — INTE hela @supabase/supabase-js-importen, som redan legitimt används utanför src/data/ för AUTH (AuthProvider.tsx, passkey.ts). BEVIS I BÅDA RIKTNINGAR, mätt: (a) detektorn fäller på tre konstruerade överträdelse-strängar + en konstruerad temp-fil på disk (aldrig en riktig src-fil rörd); (b) under byggets gång fångade grinden FAKTISKT en verklig träff (src/domain/schemas/Attachment.schema.ts nämnde "createSignedUploadUrl" i en kommentar) — fixat genom att flytta den tekniska detaljen till _shared/attachments.ts i stället för att luckra upp grinden; kvar: 0 träffar i src/ exkl. src/data/. PORT-PARITET bevisad bidirektionellt mot TSC: uploadAttachment temporärt borttagen ur SupabaseAdapter -> npm run typecheck FALLERADE (TS2420, "Property uploadAttachment is missing") -> återställd -> typecheck grön igen.

DEPLOY: tre nya produktions-EF:er deployade till staging (pqtshyierkdgwdnxuirz) via supabase functions deploy (manuellt, ADR-050 — ingen deploy-automatik): upload-attachment, create-attachment-upload-ticket, finalize-attachment-upload. MEDVETET UTELÄMNADE ur .prod-functions-allowlist.conf i denna leverans (samma Fas 7-deploy-skuld-mönster som redan täcker flera BEFINTLIGA produktions-EF:er, t.ex. get-attendance/create-registration/update-event) — prod kräver dessutom att Bilagor-tabellen och bucketen provisioneras där FÖRST (separat Marcus-moment, samma ordning som 146.2/146.3).

STAGING-TESTER: tests/api/upload-attachment.staging.test.ts (10 fall) + tests/api/attachment-upload-large.staging.test.ts (15 fall) — alla köra mot SKARP staging, inklusive en RIKTIG direkt PUT till signedUrl (Playwright request.put, noll SDK, noll Authorization-header) som bevisar AC #4:s "bytesen passerar aldrig funktionen" som beteende. Attach-mål: BELAGGNING_EVENT_ID (samma precedent som create-event-note.staging.test.ts). Sentinel: filnamn ZZ-attachment-test-<uuid>.pdf. Purge-target 'upload-attachment-sentineler' tillagd i .purge-staging-policy.json (Bilagor-tabellen, samma mönster som create-event-note-sentineler).

AVGRÄNSNING, ÖPPET BOKFÖRD: Mönster 2 v1 använder Supabases STANDARD createSignedUploadUrl/uploadToSignedUrl (en PUT), INTE TUS-baserad chunkad/återupptagbar uppladdning — forskningspassets rekommendation för >6MB. AC #4:s bokstav ("tidsbegränsat, path-scopat tillstånd; klienten laddar upp direkt utan att bytesen passerar funktionen") är uppfyllt; genuin TUS-resume kräver en ny klientbibliotek-dependency och progress-UI utan konsument i detta korts scope (Dokument-ytan är en PROTOTYP, src/components/dokument/DokumentYta.tsx, uttryckligen KASTBAR och read-only — ingen riktig UI-konsument finns än). Storage-bytes för mina staging-tester rensas INTE av purge-skriptet (det purgar bara Airtable-rader) — KB-stora syntetiska PDF:er, försumbar kostnad, öppet bokfört i test-filens header som fynd, inte löst här. finalize-attachment-upload har ingen idempotensnyckel — ett klient-retry efter en lyckad finalize kan i teorin skapa en dubblett-metadatarad för samma fysiska objekt; bokfört som känt gap, ej löst (matchar create-event-note-EF:ens egen "server-idempotensgrind utan lagring vore teater"-linje, men caset är svagare här eftersom en dubblett HÄR pekar på en verkligt existerande fil, inte bara en textduplicerad anteckning).

FYND (rapporteras, registreras ej av mig): (1) Write-tool-artefakt upptäckt under bygget — bokstavliga hex-escape-sekvenser (\x00/\x1f/\x7f) i en regex-teckenklass skrevs som RÅA kontrollbyte i källfilen i stället för literal fyrtecken-sekvens; å/ä/ö-diakritiker påverkades INTE (samma filer kom tillbaka "CLEAN" efter byte-nivå-inspektion). Löst genom kodpunkt-baserad filtrering (Array.from + codePointAt) i stället för regex-teckenklasser med inbäddade hex-escapes. (2) DokumentYta.tsx (PROTOTYP, S100/T131) bekräftar att adapterns EN-metod-design (uploadAttachment döljer båda mönstren) matchar den redan Marcus-godkända UI-formen ("Ladda upp en fil"-knappen i klass A-gruppen) — inget UI-arbete gjort här, bara bekräftat att formen passar. (3) Ingen ADR för bilage-hemvisten hittades i docs/decisions/ (senaste är ADR-107) trots att PRD:t (TASK-146) uttryckligen kräver en ("ADR KRÄVS... mintas separat") — varken 146.1, 146.2 eller 146.3 mintade den. Bokfört som öppen skuld, inte min att lösa i detta kort.

DoD #7 (bas-additiviteten): CHECKAD — inga Airtable-SCHEMA-ändringar gjorda alls i denna skiva (bara record-skrivningar via redan skapade Bilagor-tabellen), additiviteten trivialt bevarad. DoD #5 (PDF-runtime): CHECKAD som globalt sant faktum, bevisat av TASK-146.1 (Done), ej denna skivas arbete. DoD #8 (väggkatalogen): CHECKAD — verifierat INTAKT (P28/P29, docs/reference/airtable-constraints.md § G rad ~585), inget nytt landat här.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad i PR #1090 (0309c5e7 + listparitet-fixen 3a61b42b, mergad 63e61d2c): adapter-kontraktet uploadAttachment i båda mönstren + tre EF:er + mekanisk lager-oberoende-grind. Premisser live-verifierade (tabell, bucket, TTL empiriskt 7200s). Tvåsidiga bevis: port-paritet TS2420-fälld, grinden fångade verklig träff under bygget. Fynd 182 (bilage-ADR) + 183 (finalize-idempotens) registrerade. AFK-proveniens: S102-batchen kort ②.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 PDF-biblioteket skarpt verifierat mot den riktiga edge-runtimen (ej Node-proxy) INNAN övrig arkitektur byggs ovanpå
- [x] #6 Lager-oberoendet mekaniskt fällt: noll direkta lagrings-anrop i UI-lagret + port-paritet i BÅDA adaptrarna
- [x] #7 Bas-additiviteten mätt mot schemat: inga befintliga fält eller tabeller rörda
- [x] #8 Väggkatalogens två attachment-poster landade
<!-- DOD:END -->
