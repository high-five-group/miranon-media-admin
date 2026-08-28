---
id: TASK-309.22
title: >-
  Fynd: upload-attachment 502 Invalid key i prod — Storage-nyckeln bär
  icke-ASCII (ö) som Supabase avvisar
status: Done
assignee: []
created_date: '2026-08-26 02:23'
updated_date: '2026-08-28 03:15'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 588000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus röktest i prod 2026-08-26 (S108 resume 11): uppladdning av '2025-HörlurarMiranonMedia.pdf' med räckvidd Alla event gav 'Edge Function "upload-attachment" 502: Uppladdningen misslyckades: Invalid key: alla-event/3bb55da5-93c1-4c1f-be42-8a064b06cdf4-2025-HörlurarMiranonMedia.pdf' (requestId ee14ee34-05c9-4fbe-a18c-402673b561f5).

ROTORSAK, belagd i två led:
(1) Supabase Storage validerar objektnycklar mot regexen /^[A-Za-z0-9_/!.*'() &$=@;:+,?-]*$/ (supabase/storage, src/storage/limits.ts, isValidKey → ERRORS.InvalidKey) — endast ASCII. 'ö' avvisas.
(2) Vår nyckel byggs av buildAttachmentPath → buildAttachmentLeaf → sanitizeFilnamn (supabase/functions/_shared/attachments.ts rad 219–269): saneringen tar bort path-separatorer och kontrolltecken och trimmar till 200 tecken, men behåller icke-ASCII. Svenska filnamn (å ä ö) faller alltså ALLTID i prod och staging.

Klass: blockerar dokumentspåret i prod för vanliga svenska filnamn. Airtable-fältet Namn ska fortsatt bära originalfilnamnet — bara Storage-nyckeln (och därmed Lagringsnyckel) behöver vara ASCII-säker. Bakåtkompatibilitet: befintliga poster med ASCII-namn får inte byta nyckel; deriveAttachmentId hashar över (anchor, sanerat filnamn, bytes) — avgör och bokför om hash-underlaget ska vara det ASCII-säkra namnet (påverkar idempotens-nyckeln för NYA uppladdningar, aldrig befintliga). Research: branschmönster för objektnyckel-normalisering (NFKD + strip diacritics + ersätt otillåtna med '-' eller percent-encoding) — cite källa.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Uppladdning av en fil med å/ä/ö i namnet lyckas i staging (API-test i api-staging-projektet: POST med filnamnet '2025-HörlurarMiranonMedia.pdf' → 200, Storage-objekt finns, Bilagor-rad med Namn = originalnamnet)
- [x] #2 Storage-nyckeln är ASCII-säker per Supabases isValidKey-regex; befintliga poster med ASCII-namn ger oförändrad nyckel (regressionstest på sanitize/leaf-funktionerna, båda riktningar)
- [x] #3 Beslut om hash-underlaget (deriveAttachmentId) bokfört i attachments.ts docblock + data-model.md § Lagringsnyckel; prosan och koden säger samma sak (ADR-083)
- [x] #4 Klientens felmeddelande vid 502 förblir läsbart; ingen HTML byggs i klienten (ADR-057)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
RÄTTELSE 2026-08-26 (orkestreraren, efter review runda 1+2 på #1983): AC #1:s ordalydelse '→ 200' är felställd — EF:en svarar 201 för en genuint ny rad (TASK-316:s idempotens-kontrakt; 200 är reserverat för replay). AC #3:s pekare 'attachments.ts docblock + data-model.md § Lagringsnyckel' är felställd — beslutet bor i upload-attachment/index.ts:s docblock och data-model.md § 'Bucket bilagor — Storage-path-formerna'. Sakinnehållet i båda AC håller (verifierat av review-agenten runda 2, SHA 21e613fd); bockarna står mot sak, inte mot bokstav. Hash-underlaget efter runda 2: sanitizeFilnamn (originalnamn, aldrig ASCII-fall) hashas; toStorageSafe enbart för Storage-leaf.

Stängningssvansen (S108 resume 13): DoD verifierad — #1 AC 4/4 avbockade. #2 lokala grindar gröna (kortets Implementation Notes citerar review-agentens rundor 1+2). #3 diff path-scopad, gh pr diff 1983 --name-only: .purge-staging-policy.json, CONTRIBUTING.md, data-model.md, supabase/functions/_shared/attachment-filename.ts+attachments.ts, upload-attachment/index.ts, tests/api/*, tsconfig.edge-shared.json, lessons.d/*, kortfilen — inga orelaterade filer. gh pr checks 1983: samtliga körda jobb pass. Landning: PR #1983 (<https://github.com/high-five-group/miranon-media-admin/pull/1983>), merge-SHA f80ace726396d914d1c308ea46d7216771f572c3, mergad 2026-08-26T14:48:49Z.
<!-- SECTION:NOTES:END -->
