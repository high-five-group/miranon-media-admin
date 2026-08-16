---
id: TASK-147.11
title: Äkta ersätt och radera för bilagor — EF + adapter + Dokument-ytans koppling
status: To Do
assignee: []
created_date: '2026-08-16 08:39'
updated_date: '2026-08-16 10:24'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-147
ordinal: 440000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur task-147.6:s fynd 3 (2026-08-16, Marcus-GO 'byggas idag'): adaptern saknar delete/replace helt (grep delete DataSourceAdapter.ts = 0 träffar) — Dokument-ytans 'Ersätt' är klientsidig filnamnsgruppering och gamla filer ligger kvar i Bilagor-tabellen som skräp. Bygg: EF för radering/ersättning av bilage-post (SECURITY-SPEC §6.10-ribban: auth, ägarskaps-guard, aldrig bulk utan explicit lista), adapter-metod, koppling i Dokument-ytan (ersätt = ladda upp ny + radera gammal atomiskt ur användarens synvinkel). Airtable-schema FÖRE write-design: docs/reference/data-model.md. Staging-bevis idag; prod-deploy följer husets allowlist-deploy-moment (Marcus).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 EF:n raderar/ersätter en bilage-post med auth + guard enligt EF-ribban; deny-triple-klass-bevis
- [x] #2 Adapter-metod + Dokument-ytans Ersätt använder den — ingen klientsidig låtsas-ersättning kvar
- [x] #3 Staging-bevisad ände-till-ände (ladda upp → ersätt → gamla borta, nya kvar)
- [x] #4 Prod-deploy-behovet bokfört för dagens allowlist-moment
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
