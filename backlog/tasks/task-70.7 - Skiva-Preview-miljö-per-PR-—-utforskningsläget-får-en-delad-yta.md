---
id: TASK-70.7
title: 'Skiva: Preview-miljö per PR — utforskningsläget får en delad yta'
status: To Do
assignee: []
created_date: '2026-07-28 17:13'
updated_date: '2026-07-28 17:13'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-70
ordinal: 150000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SAKNAD SOM MARCUS FÅNGADE 2026-07-28: arbetsflödes-granskningen listade preview-miljön som förbättring F2 (utforskningsläget saknar delad yta) men posten föll bort mellan förbättringslistan och åtgärdsplanens åtta steg. Det var en glidning i orkestrerarens plan, inte en medveten avgränsning; Marcus upptäckte den genom att läsa granskningen mot A7-posterna.

MÅLBILDENS PLATS: granskningens § Rekommenderat framtida flöde har fyra lägen, och detta kort hör till det FÖRSTA — utforskningsläget (lokalt + lokala commits + riktade tester, ingen CI). Preview-miljön är dess delade yta. De övriga A7-korten rör integrations- och verifieringsläget.

VAD SOM FINNS I DAG: lokal dev-server (npm run dev) · staging efter landning · npm run seed:review för granskningsdata · visuell regression med CI-födda baselines (task-36.7). Granskning av en UI-ändring kräver alltså antingen att Marcus kör dev-server själv, eller att ändringen först landar i staging.

VAD EN PER-PR PREVIEW GER: en URL per PR där ändringen kan granskas före merge, utan lokal körning och utan att vänta på landning.

ÄRLIG PROPORTION — LÄS FÖRE PLOCK: för ett team med flera granskare är preview självklar. Detta repo har EN mänsklig granskare som redan kör lokalt, så vinsten är främst bekvämlighet. Kortet ändrar INTE den kritiska vägen och är därför medvetet klassat sist i TASK-70-familjen, utan dep. Det ska inte plockas före 70.1-70.6 om de konkurrerar om tid.

AVGRÄNSNING: detta är inte staging och ersätter den inte. Staging är en delad muterbar Airtable-bas + Supabase-projekt med skarp data; en preview är efemär och per PR.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Plattformsvalet är RESEARCHAT mot minst tre alternativ och rekommendationen skriven — inte valt på vana
- [ ] #2 STOPP-grind: Marcus har kvitterat plattform och kostnadsbild innan något byggs
- [ ] #3 En öppen PR får en preview-URL som visar just den PR:ens ändring; URL:en syns i PR:en
- [ ] #4 Previewen är hermetisk mot prod: den kan aldrig skriva till prod-basen app8uGPrVCVOm6LfD — verifierat, ej antaget
- [ ] #5 Kostnaden är mätt och nedskriven: bygg-minuter per PR och eventuell hosting-avgift
- [ ] #6 Previewen rivs när PR:en stängs — ingen efterlämnad yta per landad gren
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
STEG 0 — PRÖVA OM KORTET SKA BYGGAS ALLS. Detta är det enda kortet i TASK-70-familjen vars nytta inte är mätt. Innan research: skriv ner hur många gånger under de senaste två veckorna en granskning faktiskt blockerades av att ingen preview fanns. Är svaret noll är den ärliga rekommendationen att stänga kortet med motivering i stället för att bygga — dubbelriktade över-engineering-vakten skär spekulativ komplexitet ovanför golvet, och en preview-yta är inte golv.

STEG 1 — RESEARCH (AC 1). Minst tre alternativ mot primärkällor. Kandidater att undersöka, ej att anta: Vercel/Netlify preview deployments · Cloudflare Pages · GitHub Pages med per-PR-artefakt. Bedöm mot fyra axlar: hermetik mot prod (AC 4), kostnad (AC 5), rivning vid PR-stängning (AC 6), och hur previewen når data — en preview som pekar på staging ärver dess mutexproblem och dess skarpa data.

DATAFRÅGAN ÄR DEN SVÅRA. Appen läser Airtable via Edge Functions. En preview behöver antingen (a) staging, vilket gör den till ännu en konsument av en delad muterbar bas, eller (b) fixturvärlden som redan finns i tests/support/fixturvarld/ — den är hermetisk och kan serveras. Alternativ (b) är sannolikt rätt och gör previewen till en UI-yta utan datakoppling; skriv ner valet med skäl.

STEG 2 — STOPP (AC 2). Rekommendation till Marcus i klartext: plattform, kostnad, datakoppling. Bygg inget före kvittens. Detta är ett arkitekturbeslut med löpande kostnad, alltså hans.

STEG 3 — bygg det valda, med AC 3-6 som kontrakt.

ORDNING I FAMILJEN: sist, utan dep. Kortet blockerar ingenting och blockeras av ingenting — men det ska inte konkurrera ut 70.1-70.6, som alla rör den kritiska vägen.
<!-- SECTION:PLAN:END -->
