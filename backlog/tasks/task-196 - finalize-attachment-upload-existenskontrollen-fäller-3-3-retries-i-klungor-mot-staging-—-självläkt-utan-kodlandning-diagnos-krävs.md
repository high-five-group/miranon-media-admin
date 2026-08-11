---
id: TASK-196
title: >-
  finalize-attachment-upload: existenskontrollen fäller 3/3 retries i klungor
  mot staging — självläkt utan kodlandning, diagnos krävs
status: To Do
assignee: []
created_date: '2026-08-11 18:30'
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
