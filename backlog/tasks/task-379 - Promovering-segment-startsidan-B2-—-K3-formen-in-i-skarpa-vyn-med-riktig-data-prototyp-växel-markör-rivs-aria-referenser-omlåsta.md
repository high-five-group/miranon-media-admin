---
id: TASK-379
title: >-
  Promovering: segment-startsidan (B2) — K3-formen in i skarpa vyn med riktig
  data, prototyp/växel/markör rivs, aria-referenser omlåsta
status: To Do
assignee: []
created_date: '2026-09-03 11:12'
updated_date: '2026-09-03 12:15'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 681000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SNABBVÄG PÅ MARCUS ORDER (S117, 2026-09-03: 'Se till att denna promovering går snabbt. Det bör vara snabbt och enkelt'): EN PR, inget PRD, inga skivor, inget separat QA-kort — avviker öppet från S114 Del 3 beslut 7 (PRD per yta). FACITET ÄR SPECEN: tasks/sessions/bilagor/s114-segmentlistan-konvergens/facit.json (§ not beskriver formen rad för rad) + facit-segment-listan.png / facit-segment-listan-tomlage.png. Prototypen som promoveras: src/components/segment/prototyp/SegmentListaKonvergens.tsx (K3, statisk formdata). Skarpa vyn som tar emot formen: VariantD.tsx § SegmentLista + § SegmentKort (/mer/segment, variant=null) — dess DATA och HANDLERS (poster ur get-segments + byggDeFjorton, useEntitetsMedlemmar per kort, TackningsPanel, Nytt segment / Dela upp / Markera-läget / onOppna, 349:s localStorage-minne för info-krysset, useVyFokus, print:hidden) ärvs oförändrade; det som byts är FORMEN (ADR-103: prototypen promoveras, formen ändras inte). Sektionering: sparade segment (ur basen) under 'Dina segment', de fjorton (generatorn) under 'Färdiga grupper' — VariantD:s 'EN lista, ingen gruppering' (Marcus 2026-08-10) är omprövad i S114 Del 3 beslut 3 och rivs öppet. FÖRKRAV FÖR LANDNING: Marcus stämpel (godkand satt via facit:godkann) på main — check-facit:s B3-spärr fäller rivningen tills dess; bygget får starta före, PR:en landar efter. Korthöjdslåset 168 → 132 px omstämplas därmed öppet (S114 Del 3 beslut 3). EJ I SCOPE: spara-delen (save-segment skarp + 'Prototyp – ingenting sparades'-noten, egen PR efter), 6h-sändningen, andra ytors korthöjd. Källor: S117 sessionsdok Del 1–2 · S114 Del 3 beslut 3/4/6/7 · ADR-102/103/104 · .facit-policy.conf § markörer (S117-blocket) · tests/visual/segment-promoverings-grind.spec.ts · TASK-374.1–374.5 (B3:s promovering som precedent för aria-omlåsning och baseline-vägen — INTE för skivningen).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Skarpa vyn /mer/segment (variant=null) renderar facitets form med RIKTIG data: 'Dina segment' (sparade ur get-segments; facitets tomläge när basen är tom) och 'Färdiga grupper' (de fjorton), h2 + antalsbricka (ingen bricka vid noll), kort i K3-anatomin (namn en rad trunkerad med title / mening två reserverade rader / antal med Users-ikon, min-h-6; 132 px DOM-mätt), täckningen som textknapp på Färdiga grupper-raden ('Full täckning · N av N' när frisk, annars skarpa vyns etikett) som togglar TackningsPanel; skarpa handlers och markera-läget oförändrade i funktion.
- [ ] #2 Prototyp-substratet borta i SAMMA landning: SegmentListaKonvergens.tsx, ?variant=a-grenen + PrototypeSwitcher-monteringen ur mer/segment.tsx, markören 'K3 - brickor, korthöjd låst' ur .facit-policy.conf (städas i samma landning, TASK-192-lärdomen). bash scripts/check-facit.sh grön med rivnings-klausulen (manifestet stämplat).
- [x] #3 Aria-referenserna segment-listan-visual-desktop.aria.yml + -mobile omlåsta mot den nya formen; diffen (gammal → ny) redovisad i klartext i PR-kroppen för Marcus kvittens; övriga fem referenser (detaljvyn, mallvyn, täckningsvyn m.fl.) OFÖRÄNDRADE — grinden bevisar att de ytorna står orörda.
- [x] #4 Visuella baselines för segment-listan hanterade: riktad baseline-run ur CI (visual-baselines.yml dispatch) eller motsvarande; PR-kroppen redovisar vägen och run-id.
- [x] #5 DoD-kommandona gröna (npm run test:api, typecheck, biome check, build) + node scripts/check-langa-streck.mjs + check-facit; review-loopen konvergerad; CI grön per jobb på pushad commit.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC #2 (rivningen) = PR 2 efter Marcus stämpel
<!-- SECTION:NOTES:END -->
