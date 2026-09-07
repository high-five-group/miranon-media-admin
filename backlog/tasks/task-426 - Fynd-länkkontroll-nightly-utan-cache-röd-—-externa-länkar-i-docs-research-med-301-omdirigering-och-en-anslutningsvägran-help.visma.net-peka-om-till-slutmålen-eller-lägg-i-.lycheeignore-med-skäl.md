---
id: TASK-426
title: >-
  Fynd: länkkontroll (nightly, utan cache) röd — externa länkar i docs/research/
  med 301-omdirigering och en anslutningsvägran (help.visma.net); peka om till
  slutmålen eller lägg i .lycheeignore med skäl
status: To Do
assignee: []
created_date: '2026-09-07 15:30'
labels:
  - ready-for-agent
dependencies: []
priority: low
ordinal: 756000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: Nightly-körning 34088565869 (2026-09-07 05:54 UTC), jobbet 'Länkkontroll (utan cache)' rött: 'Errors in' för tio filer under docs/research/ (task-103-deno-verktygskedjan-i-node-repo-2026-07-31, swish-rapport-exportformat-2026-08-30, segment-byggare-branschmonster-2026-08-16, prod-postgres-read-only-agentatkomst-2026-09-03, pdf-scrollprestanda-pdfium-chrome-2026-08-22, pdf-forhandsgranskning-serverlosning-natverkstjanst-2026-08-22, pdf-bifoga-eller-lanka-branschmonster-2026-08-19, parallella-sessioner-och-merge-van-2026-09-04, mcp-verktyg-apify-firecrawl-composio-devtools-higgsfield-2026-09-04, marcus-designpushbacks-bank-transkript-2026-09-05), t.ex. docs.customer.io 301 → /messaging/metrics/message-failed/ och '[ERROR] help.visma.net … Connection failed'. PR-CI:s Docs link check (med cache) är grön — driften syns bara utan cache. Åtgärd: kör nightly-jobbets lychee-kommando lokalt (läs run-blocket i .github/workflows/nightly.yml, utan cache), ersätt varje 301 med slutmålet, och bokför anslutningsfel som inte beror på oss i .lycheeignore med en kommentar per rad (skäl + datum). Ändra aldrig research-dokens sakinnehåll, bara länkmål.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Nightly-jobbets länkkontroll körd lokalt utan cache: exit 0, utdatans slutrad bokförd i notes
- [ ] #2 Varje 301 ersatt med slutmålet; varje kvarvarande fel i .lycheeignore med kommentar (skäl + datum), listade i notes
- [ ] #3 Diffen rör enbart länkmål och .lycheeignore — ingen sakändring i research-doken
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
