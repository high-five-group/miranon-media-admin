---
id: TASK-112
title: >-
  Testgraf-mätningen — källkods-rotad skuggmätning av acceptance-urvalet i
  post-merge (ADR-077-slotten)
status: To Do
assignee: []
created_date: '2026-08-01 11:13'
updated_date: '2026-08-07 11:19'
labels:
  - ready-for-agent
dependencies: []
priority: low
ordinal: 185000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beslut (Marcus, S91 Del 27, bekräftat 2026-08-01): MÄTNINGEN byggs, inte urvalet — ADR-077 § Beslut 1 lämnade testgraf-slotten öppen, och den fylls med ett källkods-rotat MÄTINSTRUMENT, inte ett urval. Grund: två oberoende research-pass landade på samma siffra — 72 % av icke-rutt-filerna nås från fler än en rutt (96/133 respektive 97/134) — och en rutt-rotad graf ser strukturellt inte datalagret: `AirtableAdapter`, `dataSource` och `router.ts` sitter OVANFÖR rutterna via router-context-injektionen (ADR-055), så en ändring där väljer noll specar i varje rutt-rotad grafvariant (verktygspasset § B.6).

Formen är passens gemensamma rekommendation — skuggkörning (Launchable observation mode; Microsofts T1/T2-råd): `post-merge` kör redan full acceptance-klass på varje mergat träd, så instrumentet beräknar där vad ett källkods-rotat urval SKULLE ha valt för samma diff och bokför differensen. Noll extra testtid. Post-hoc-mätningen (C4) är den enda av de fyra säkerhetsmekanismerna mot falsk grön som alla jämförelseobjekt bär och vi helt saknar, och den billigaste att stänga. Precedent-passets slutsats: utan detta instrument är varje utvidgning av urvalet ett omdömesbeslut; med det blir den ett mätbeslut.

Form-fakta ur passen som exekveringen ska respektera: grafproduktion via Rollups `moduleParsed` är förstahandsval (appens verkliga graf, typ-only-fri, hanterar autoCodeSplitting; 3 s lokalt) med dependency-cruiser som andrahandsval (1,3 s kall / 0,75 s varm, ingen byggkörning, kan MÄRKA typ-only; --affected ger omvända stängningen) · `routeTree.gen.ts`-hubben måste klippas explicit, annars når varje rutt hela appen (§ B.4) · typ-only-kanter nästan fördubblar urvalet (554 mot 448 kanter; § B.2, B.8) · bron spec→rutt är en goto()-URL, inte en import — den härleds mekaniskt ur specarna (§ B.9 alternativ b) · Playwrights --only-changed är mätt strukturellt oanvändbar (0 tester, exit 0 på källändring) och plugin-haken är privat med tyst grönt felläge — ingen av dem används (§ D1 respektive § A.4/D.2).

EXEKVERING EFTER S91 (Marcus scope-order 2026-08-01). Kortet är avsiktligt INTE märkt ready-for-agent; etiketten sätts när S91 är stängd.

Underlag: docs/research/testurval-kallkodsdrivet-2026-07-29.md · docs/research/kallkodsdrivet-testurval-verktyg-2026-07-29.md · ADR-077 § Beslut 1 · ADR-055 · scripts/acceptance-urval.sh (dagens spec-lokala urval, orört av detta kort).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Skuggmätningen bor i post-merge-flödet där full acceptance-klass redan körs: per mätt körning bokförs den mergade diffens filer, vilka spec-filer ett källkods-rotat urval skulle ha valt, och full klassens faktiska per-spec-utfall — utan extra testtid (precedent-passet § Rekommendation steg 1; C4)
- [ ] #2 Grafen är källkods-rotad och ser appens infrastruktur: en ändring i main.tsx-kedjan (B.6-klassen, t.ex. AirtableAdapter.ts) bokförs som full klass — aldrig som noll valda specar — och routeTree.gen.ts-hubben är klippt explicit (§ B.4); bevisat med minst ett kört fall per sida, inte antaget
- [ ] #3 Typ-only-kanter är filtrerade eller märkta, och valet av grafproducent (Rollup moduleParsed förstahand / dependency-cruiser andrahand) är motiverat i implementation notes mot passens mätningar (§ B.2, § B.8, § Dom)
- [ ] #4 Bron spec→rutt är mekaniskt härledd ur goto()-anropen och grindad från dag ett: en spec vars URL inte matchar någon existerande rutt fälls/flaggas — tvåsidigt bevisat med grönt läge och planterat fel (§ B.9, § C sista stycket, § D.3)
- [ ] #5 Mätserien är efterhandsanalyserbar utan omkörning: rådata per körning sparas så miss-raten — fällningar i full klass som urvalet inte skulle ha valt — kan räknas i efterhand (C4-formerna; samma rådata-princip som flake-riggen)
- [ ] #6 Ren observation: scripts/acceptance-urval.sh, PR-grindens urval och befintliga jobb-beteenden är oförändrade — mätningen ändrar inget urval (beslutet + verktygspasset § Rekommendation 3–4)
- [ ] #7 Grindarna för rörd fil-klass gröna med mätta exitkoder; workflow-ändringar verifierade med actionlint i CI-formens exakta anrop
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
