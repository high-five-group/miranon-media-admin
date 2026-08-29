---
id: TASK-341
title: >-
  Fynd: DocRaptor strippar okända prince_options tyst (HTTP 200) — en felstavad
  nyckel i mall-render.ts ger grön körning och utebliven effekt
status: To Do
assignee: []
created_date: '2026-08-29 14:33'
labels:
  - ready-for-agent
dependencies: []
ordinal: 627000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur research-passet docs/research/forhandsgranska-spara-atervand-bilageflodet-2026-08-29.md § Oväntade fynd (S113): DocRaptor svarar 200 och strippar okända nycklar i prince_options utan varning (belagt när en pdf_id-parameter strippades tyst vid API-gränsen). Följd: en felstavad eller framtida borttagen option i supabase/functions/_shared/mall-render.ts (ADR-125 § 4) ger grön rendering utan den avsedda effekten — precis den tysta felklassen ADR-083 varnar för i prosa, fast i konfiguration. Uppdrag: (1) lista de prince_options mall-render.ts faktiskt skickar och verifiera var och en mot DocRaptors aktuella referens (WebFetch + browser-kontroll — WebFetch kan fabricera, se lessons.d); (2) lägg en enhetstest som låser nyckelnamnen mot en lokal allowlist härledd ur referensen (så en felstavning fäller lokalt); (3) bokför i mall-render.ts filhuvud. Ingen ändring av renderingsbeteendet.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Varje prince_options-nyckel som skickas är verifierad mot DocRaptors referens (källa + datum i Implementation Notes); avvikelser rättade
- [ ] #2 Enhetstest låser nyckelmängden (en felstavad nyckel fäller lokalt); filhuvudet i mall-render.ts bär fällan
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
