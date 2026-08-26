---
id: TASK-309.18
title: Två adapter-metoder anropar en riven Edge Function — död kod med 404-potential
status: In Progress
assignee: []
created_date: '2026-08-24 17:31'
updated_date: '2026-08-26 04:01'
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
- [x] #1 Avgjort och bokfört: rivs de två metoderna + interface-raderna, eller pekas de om till den skarpa DocRaptor-vägen (generate-event-attachment / preview-receipt)?
- [x] #2 Beslutet verkställt; DataSourceAdapter.ts:s öppen-skuld-docblock uppdaterad eller borttagen så att prosan och koden säger samma sak (ADR-083)
- [x] #3 SupabaseAdapter.ts:283:s motsvarande implementation följer med i samma beslut
- [x] #4 ADR-122 rad 100/181: AnmalningarList-referenserna rättade via daterat § Updates-tillägg, eller öppet förkastade med skäl
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BESLUT (väg A, Marcus mandat i klartext 2026-08-26 — "Du har mandat att ta besluten. Men var noggrann och chansa inte, ta inget för givet.", orkestrerarens beslut): RIVNING. Premiss-pass körd mot origin/main (192bbd29 vid start, 27749373 vid mätning — 13 commits bakom, ej blockerande) innan design:

- git grep "test-docraptor-render" repo-brett: 0 träffar i supabase/functions/ (katalogen finns ej) och 0 i .prod-functions-allowlist.conf. Kvarvarande 60+ träffar är ALLA historiska kommentarer/docs/kort — ingen levande EF-anropskod. Bekräftar TASK-309.4-rivningen.
- Skarpa vägen verifierad: useForhandsgranskaBilaga.ts går redan via previewEventTemplate -> generate-event-attachment (server-side Eta+DocRaptor, ADR-125 § 5) — GenereringsPrototyp.tsx (den enda tidigare anroparen) existerar inte längre. Noll anropare av renderPdfFranHtml/renderPdfTillUtkast utanför adapter-lagret bekräftat (grep mot src/components, src/routes, src/data/mutations, src/data/queries, tests/, src/hooks/ — tomt utöver adapterfilerna själva).
- ADR-122 rad 100/181 (AnmalningarList i presens): git grep bekräftar filen döpt om till AnmalningarSida.tsx (TASK-299.5) och att VARJE annan levande kodplats redan bär "f.d. AnmalningarList"-annotering — ADR-122 var enda kvarvarande undantaget.

VERKSTÄLLT:
- renderPdfFranHtml + renderPdfTillUtkast: rivna ur DataSourceAdapter.ts (interface+docblock), AirtableAdapter.ts (implementation) och SupabaseAdapter.ts (NOT_IMPLEMENTED-stub).
- Döda hjälpare som blev oanvända av rivningen, rivna i samma beslut: postEdgeFunctionBlob (supabase-client.ts, hade exakt en anropare) och UtkastTyp (Vite-sidans typ, delades bara av de två rivna metoderna — Deno-sidans UtkastTyp i supabase/functions/_shared/utkast.ts är en separat typ och rörs inte). UtkastResultatSchema BEHÅLLS — används fortfarande av generate-event-attachment.staging.test.ts + preview-receipt.staging.test.ts + Attachment.schema.ts.
- DataSourceAdapter.ts's öppen-skuld-docblock ersatt med en kort "skulden är betald"-not (ADR-083).
- MallId:s docblock (refererade "UtkastTyp ovan") omskriven för att inte peka på en riven symbol.
- ADR-122: rad 100 + 181 rättade till AnmalningarSida.tsx (f.d. AnmalningarList.tsx) med inline-markör, samma konvention som ADR:ns egen 2026-08-22-rättelse (§ Fynd 1) + fullt daterat § Updates-tillägg (2026-08-26).

GRINDAR (mätta, denna gren):
- typecheck: exit 0 (tsr generate + tsc -b --noEmit, 0 fel — bevisar TS-parity mellan de tre adapterfilerna utan de rivna metoderna).
- biome check .: exit 0 (0 fel; enda diagnostik är förbefintliga CSS-!important-varningar i src/styles/base.css, orörda av denna diff).
- check-langa-streck.mjs: OK, 260 filer skannade, 0 ofångade.
- build: exit 0.
- test:api: api-pure 728/728 gröna (inkl. attachment-layer-independence.test.ts "port-paritet AC #1" och ef-metod-vakt.test.ts — de facto adapter-paritet + lagervakt, ADR-056/057). api-staging blockerades av staging-preflighten (post-merge.yml körning 32927499820 höll staging) — samma fallback uppdraget förutsåg.
- check:docs: exit 0, 14/14 gröna (ADR-Updates-formatet verifierat mot frontmatter+lifecycle-grindarna).

Inget grep-baserat test hittades som specifikt namnger renderPdfFranHtml/renderPdfTillUtkast (adapter-paritet enforceras av TS "implements DataSourceAdapter", redan bevisat av grönt typecheck) — inget sådant test behövde uppdateras.
<!-- SECTION:NOTES:END -->
