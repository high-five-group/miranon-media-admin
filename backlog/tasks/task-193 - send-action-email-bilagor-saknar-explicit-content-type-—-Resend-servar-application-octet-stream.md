---
id: TASK-193
title: >-
  send-action-email-bilagor saknar explicit content-type — Resend servar
  application/octet-stream
status: Done
assignee: []
created_date: '2026-08-10 18:17'
updated_date: '2026-08-26 03:27'
labels: []
dependencies: []
ordinal: 358000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND (FRAMME-verifikatet varv 3, 2026-08-10, mail b1e1b27b-e579-4c39-960d-f0a0cc8b7ea1): makeRealSingleSender i send-action-email/index.ts mappar attachments till {filename, content} UTAN type-fält → Resend faller tillbaka på application/octet-stream i stället för application/pdf. Blockerar inget (filändelsen .pdf styr klienthantering, innehållet bevisat intakt %PDF-1.7) men är en billig korrekthetsförbättring. FÖRVÄNTAT: sätt type: 'application/pdf' (eller härled ur filändelsen) i attachment-payloaden; verifiera mot Resend API-dokumentationens attachment-schema (research före implementation).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Done-flipp S112: deriveContentType i PR #1940, landad + post-merge grön; contentType-formen verifierad mot Resends officiella SDK-exempel. Kortet saknar AC — fyndets FÖRVÄNTAT uppfyllt. Landning: PR #1940
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landning: PR #1940
<!-- SECTION:FINAL_SUMMARY:END -->
