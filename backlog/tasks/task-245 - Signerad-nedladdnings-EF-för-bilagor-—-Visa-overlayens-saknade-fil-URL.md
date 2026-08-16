---
id: TASK-245
title: Signerad nedladdnings-EF för bilagor — Visa-overlayens saknade fil-URL
status: To Do
assignee: []
created_date: '2026-08-16 14:40'
updated_date: '2026-08-16 15:49'
labels:
  - ready-for-agent
dependencies: []
ordinal: 453000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fynd ur dokument-varv 3 (PR #1415): Marcus kvitterade overlay-förhandsvisning med ladda ner-fallback för bilagor, men ingen fil-URL existerar — Storage-bucketen är privat, ingen RLS-policy, ingen signerad nedladdnings-EF (verifierat mot Attachment.ts, _shared/attachments.ts, samtliga attachment-EF-mappar). Varv 3 byggde en ärlig info-dialog i stället för att fejka; detta kort stänger gapet. Förväntat beteende: klick på Visa på en bilage-rad öppnar overlay med riktigt filinnehåll; nedladdning som fallback för oförhandsvisningsbara format.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 En Edge Function ger tidsbegränsad signerad URL för en bilaga i den privata Storage-bucketen, med samma ägarskaps-guard som delete-attachment (147.11-mönstret) och deny-triple-skydd
- [x] #2 DokumentYta:ns Visa-dialog för bilagor visar riktig förhandsvisning via URL:en (bild/PDF) med ladda ner-fallback — ersätter varv 3:s ärliga info-dialog (Marcus kvitterade rekommendationen 2026-08-16; gapet fanns redan, varv 3 avtäckte det)
- [x] #3 EF:en i CI:s allowlist + prod-deploy-klicklistan uppdaterad (EF deployas ej automatiskt)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
get-attachment-download-url-EF (GET, query eventId+attachmentId) byggd mönster-troget mot delete-attachment (TASK-147.11): samma ägarskaps-guard (Event-länk måste innehålla eventId, 403 annars), samma EF1-EF6-ribba (SECURITY-SPEC §6.10), 409 (inte 404/500) om Lagringsnyckel saknas (legacy-rad). TTL 300s (5 min), källbelagt mot AWS Prescriptive Guidance (signed URL best practices — 'minutes to hours', korta TTL:er rekommenderas) i _shared/attachments.ts § SIGNED_DOWNLOAD_URL_TTL_SECONDS. Deployad till staging (pqtshyierkdgwdnxuirz) via 'supabase functions deploy get-attachment-download-url --project-ref pqtshyierkdgwdnxuirz'. Deny-triple + ägarskaps-guard + ÅTKOMST-bevis (verkligt HTTP-anrop mot signerad URL, byte-för-byte-längd verifierad) skarpt gröna: 9/9 i tests/api/get-attachment-download-url.staging.test.ts. DokumentYta.tsx: ny BilagaVisaKnapp-komponent (skild från generiska VisaKnapp) — lazy fetch (enabled: isOpen), format via filnamnsändelse (pdf/bild/okänt), iframe för PDF + img för bild + MessageBox-fallback för okänt format, alltid en 'Ladda ner'-länk. Empiriskt verifierat i dev-servern (mot staging) mot TVÅ riktiga bilagor på recIFrxHZw165ycXk: en genuin klass B-PDF (generate-event-attachment) renderade FULLSTÄNDIGT korrekt i iframen (Chrome PDF.js-vy, läsbart innehåll); en klass A-sentinel (upload-attachment.staging.test.ts:s pseudo-PDF-bytes, inte en strukturellt giltig PDF) gav PDF.js egen 'Det gick inte att läsa in PDF-dokumentet'-felskärm INUTI iframen — bevisar att iframe/CSP/sandbox INTE blockerar (ingen CSP är ens kopplad in i appen ännu, verifierat) och att PDF.js-felet är en egenskap hos testfixturens FEJKADE bytes, inte en bugg. Escape stängde dialogen och focus återgick till triggerande Visa-knappen (Modal-primitivens dokumenterade a11y-kontrakt, empiriskt bekräftat, inte bara antaget). Bild/okänt-grenarna INTE empiriskt körda i UI:t (bucketen tillåter idag bara application/pdf, ingen icke-PDF-bilaga existerar i staging) — verifierat via kod-granskning + typecheck, disclosed gap. Prod-deploy: get-attachment-download-url tillagd i .prod-functions-allowlist.conf (CI:s ef-metod-vakt.test.ts + test-deploy-prod-functions.sh omfattar den automatiskt). Den FAKTISKA prod-deployen (scripts/deploy-prod-functions.sh) är INTE utförd av denna agent — HITL, hör till prod-momentets klicklista (Marcus-auktoriserad handling).
<!-- SECTION:NOTES:END -->
