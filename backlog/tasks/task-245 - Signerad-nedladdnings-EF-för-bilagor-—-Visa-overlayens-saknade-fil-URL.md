---
id: TASK-245
title: Signerad nedladdnings-EF för bilagor — Visa-overlayens saknade fil-URL
status: To Do
assignee: []
created_date: '2026-08-16 14:40'
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
- [ ] #1 En Edge Function ger tidsbegränsad signerad URL för en bilaga i den privata Storage-bucketen, med samma ägarskaps-guard som delete-attachment (147.11-mönstret) och deny-triple-skydd
- [ ] #2 DokumentYta:ns Visa-dialog för bilagor visar riktig förhandsvisning via URL:en (bild/PDF) med ladda ner-fallback — ersätter varv 3:s ärliga info-dialog (Marcus kvitterade rekommendationen 2026-08-16; gapet fanns redan, varv 3 avtäckte det)
- [ ] #3 EF:en i CI:s allowlist + prod-deploy-klicklistan uppdaterad (EF deployas ej automatiskt)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
