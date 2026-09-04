---
id: TASK-341
title: >-
  Fynd: DocRaptor strippar okända prince_options tyst (HTTP 200) — en felstavad
  nyckel i mall-render.ts ger grön körning och utebliven effekt
status: Done
assignee: []
created_date: '2026-08-29 14:33'
updated_date: '2026-08-29 17:16'
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
- [x] #1 Varje prince_options-nyckel som skickas är verifierad mot DocRaptors referens (källa + datum i Implementation Notes); avvikelser rättade
- [x] #2 Enhetstest låser nyckelmängden (en felstavad nyckel fäller lokalt); filhuvudet i mall-render.ts bär fällan
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Källa: https://docraptor.com/documentation/api, verifierad WebFetch + browser-kontroll (Playwright, document.body.innerText) 2026-08-29, verbatim-citat kontrollerade mot sidans faktiska text innan de citerades (tasks/lessons.d/webfetch-citat-verifieras-i-browser-fore-citering.md).

PREMISSAVVIKELSE (bokförd, ej tyst rättad): kortet antog att mall-render.ts skickar ett eller flera prince_options-fält som behöver verifieras nyckel för nyckel. Mätt fakta (grep + läsning av postaTillDocRaptor): filen skickar NOLL prince_options-nycklar i dag — inget prince_options-objekt finns i JSON-kroppen. De facto skickas EXAKT fem topp-nivå-nycklar: test, document_type, document_content, name, javascript — samtliga verifierade mot referensen. document_type är INTE en felstavning: sidan säger verbatim 'This field was previously called document_type and is still available for applications that depend on it.' javascript är korrekt topp-nivå (DocRaptors egen JS-motor), skilt från det nästlade prince_options[javascript] (Princes motor).

Enhetstest: tests/api/mall-render-docraptor-request.test.ts (5 test, källkods-nivå — mall-render.ts kan inte importeras i Node p.g.a. esm.sh-import). Låser (1) de fem faktiska topp-nivå-nycklarna mot en allowlist på 19 dokumenterade DocRaptor-parametrar, och (2) framåtsäkrat: om ett prince_options-block någonsin läggs till prövas dess nycklar mot en allowlist på 32 dokumenterade prince_options-nycklar. Bidirektionellt bevisat 2026-08-29: en injicerad felstavning (document_type -> documnet_type) fällde testen 2/5 exakt som avsett, reverterad efteråt (diff verifierad identisk mot backup).
<!-- SECTION:NOTES:END -->
