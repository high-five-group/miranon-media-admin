---
id: TASK-309.18
title: Två adapter-metoder anropar en riven Edge Function — död kod med 404-potential
status: To Do
assignee: []
created_date: '2026-08-24 17:31'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 584000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
AVTÄCKT 2026-08-24 av svep-passet för döda referenser efter S108:s rivningar.

src/data/adapters/AirtableAdapter.ts bär två metoder som anropar Edge Function-namnet 'test-docraptor-render':

  rad 1063  renderPdfFranHtml()     → postEdgeFunctionBlob('test-docraptor-render', …)
  rad 1093  renderPdfTillUtkast()   → postEdgeFunction('test-docraptor-render', …)

Den funktionen är RIVEN. Mätt mot origin/main: 0 träffar i supabase/functions/ (riven i TASK-309.4, commit 10f006b6) och 0 träffar i .prod-functions-allowlist.conf.

INTE en levande bugg — mätt: noll anropare utanför adapter-lagret (git grep mot src/components/, src/routes/, src/data/mutations/, src/data/queries/ ger tomt). Metoderna är alltså död kod i dag.

MEN skulden är verklig: interfacet DataSourceAdapter deklarerar båda metoderna, så nästa yta som konsumerar dem får ett 404-svar från en funktion som inte finns — och felet uppstår då i en helt annan session än den som skapade det. Docblocken i DataSourceAdapter.ts § renderPdfFranHtml bokför skulden öppet ('Rivning … är UTANFÖR denna skivas scope … bokförs i stället här som öppen skuld'), vilket var rätt då. Detta kort gör den bokföringen plockbar.

Svep-agenten rörde INTE koden, med rätta: dess uppdrag var avgränsat till kommentarer och prosa, och en rivning är ett kod-beslut.

ANGRÄNSANDE FYND ur samma pass, ej åtgärdat: ADR-122 rad 100 och 181 refererar AnmalningarList.tsx i presens utan 'riven'-not (filen döptes om till AnmalningarSida.tsx i TASK-299.5). Agenten lämnade dem medvetet — repots ADR-konvention är att rätta via daterade § Updates-tillägg, aldrig genom tyst omskrivning av ADR-kroppen. Det är ett eget litet beslut, inte en sweep-åtgärd.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Avgjort och bokfört: rivs de två metoderna + interface-raderna, eller pekas de om till den skarpa DocRaptor-vägen (generate-event-attachment / preview-receipt)?
- [ ] #2 Beslutet verkställt; DataSourceAdapter.ts:s öppen-skuld-docblock uppdaterad eller borttagen så att prosan och koden säger samma sak (ADR-083)
- [ ] #3 SupabaseAdapter.ts:283:s motsvarande implementation följer med i samma beslut
- [ ] #4 ADR-122 rad 100/181: AnmalningarList-referenserna rättade via daterat § Updates-tillägg, eller öppet förkastade med skäl
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
