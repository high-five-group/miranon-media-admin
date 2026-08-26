---
id: TASK-309.22
title: >-
  Fynd: upload-attachment 502 Invalid key i prod — Storage-nyckeln bär
  icke-ASCII (ö) som Supabase avvisar
status: To Do
assignee: []
created_date: '2026-08-26 02:23'
updated_date: '2026-08-26 03:26'
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
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
