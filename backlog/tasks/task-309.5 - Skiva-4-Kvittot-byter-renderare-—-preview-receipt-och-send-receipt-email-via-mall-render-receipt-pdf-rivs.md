---
id: TASK-309.5
title: >-
  Skiva 4: Kvittot byter renderare — preview-receipt och send-receipt-email via
  mall-render, receipt-pdf rivs
status: Done
assignee: []
created_date: '2026-08-23 14:19'
updated_date: '2026-08-24 17:03'
labels:
  - ready-for-agent
dependencies:
  - TASK-309.4
parent_task_id: TASK-309
ordinal: 566000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Kvittot kunden får vid betalning är den granskade HTML-mallen — inte längre det gamla pdf-lib-ritade — och förhandsgranskningen visar exakt det som skickas. Täcker användarberättelser: 16, 17, 32.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 preview-receipt och send-receipt-email renderar kvittot via renderaMallPdf('kvitto', …) med samma ifyllnadsdata som i dag (TASK-306:s fält inkl. Bokföringstext (kvitto)); receipt-pdf.ts och pdf-lib-beroendet rivna; receipt-content.ts:s filhuvud beskriver det faktiska kontraktet (Del 7:s ADR-083-fynd rättat)
- [x] #2 Staging-tester: förhandsgranskningen och det skickade kvittot är byte-identiska för samma indata; texten sökbar; typsnitt inbäddat; ingen pdf-lib-signatur i PDF:en
- [x] #3 Bilage-lagervakten och kvittots befintliga tester (innehåll, numrering) gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [x] #6 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Skiva 4 flyttade kvittot till den granskade HTML-mallen. preview-receipt och send-receipt-email renderar via renderaMallPdf(kvitto, …) med samma ifyllnadsdata som tidigare (TASK-306:s fält inklusive Bokföringstext (kvitto)); `_shared/receipt-pdf.ts` och pdf-lib-beroendet är rivna, och `_shared/receipt-content.ts`:s filhuvud rättat att beskriva det faktiska kontraktet (Del 7:s ADR-083-fynd). Förhandsgranskningen visar därmed exakt det som skickas.

BARS AV: PR #1880, commit f04e6a57 (MERGED 2026-08-23T18:15Z, 15 filer).
GRIND-UTFALL: 12 CheckRuns SUCCESS + 3 SKIPPED på exakt f04e6a57 — noll icke-gröna. Landad via merge-kön.

DoD-belägg tillagt 2026-08-24:
#3 CI grön per jobb — check-rollupen ovan, mätt via gh pr view på PR #1880.
#5 Prod-schemaändringar endast efter Marcus GO — uppfyllt vacuously OCH belagt: skivans 15 filer bär noll prod-schemaoperationer (EF-kod, mallmoduler, förlagor och tester); prod-schemat för bilagespåret skapades först i TASK-309.9 efter Marcus GO i klartext per tabell (bokfört i commit 2290fa8f).
Punkterna #1, #2, #4 och #6 var redan bockade av bygg-agenten; #6 dessutom oberoende ommätt 2026-08-24 — lagervakten `tests/api/attachment-layer-independence.test.ts` 7/7 gröna, exit 0.

Stängd av orkestrerad stängningsagent 2026-08-24 mot post-merge-bevis.
<!-- SECTION:FINAL_SUMMARY:END -->
