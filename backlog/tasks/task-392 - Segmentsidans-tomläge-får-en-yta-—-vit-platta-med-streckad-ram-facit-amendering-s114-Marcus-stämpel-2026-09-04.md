---
id: TASK-392
title: >-
  Segmentsidans tomläge får en yta — vit platta med streckad ram
  (facit-amendering s114, Marcus stämpel 2026-09-04)
status: To Do
assignee: []
created_date: '2026-09-04 10:36'
updated_date: '2026-09-04 10:48'
labels:
  - ready-for-agent
dependencies: []
ordinal: 689000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
URSPRUNG (Marcus 2026-09-04, S120 Del 1 punkt 2, verbatim i sessionsdoket): 'borde inte hela Inga sparade segment än-blocket ha en bakgrund? Typ en bakgrund med lite textur så det ser proffsigt och snyggt ut?'. Facitet s114-segmentlistan-konvergens (facit.json rad 14) sade 'ingen grå låda' och S114 beslut 3 låste neutralt tomläge — ändringen är därför en öppen FACIT-AMENDERING efter iteration i webbläsaren. ITERATIONEN (PR #2308, draft): v1 = KORT_KLASS-grå platta + punktraster (8 % text-ton, 20 px) — Marcus: 'Gillar inte bakgrunden med prickarna. Och jag tycker den är för grå liksom, bör vara en ljusare variant så ytan skiljer sig från alla andra gråa saker på sidan.' v2 = vit yta (bg-surface) med tunn streckad ram i husets kant-token, rundning rounded-2xl, py-10, texturtokens rivna — Marcus STÄMPEL: 'Agenten har redan byggt om. Nu blev det en streckad kontur bara. Ser jättebra ut. Kör på den.' FORMEN BOR i src/components/segment/prototyp/VariantD.tsx (skarpa vyn, tomläges-blocket rad ~2157–2180). Text och kapsel oförändrade (stämplat ordval). Källor: S120 sessionsdok Del 1 · PR #2308 · s114-facit.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Tomläget 'Inga sparade segment än' renderas i en container med bg-surface, border border-dashed i kant-token (contrast-more: border-strong), rounded-2xl, py-10; ingen textur, inga kvarvarande tomläges-tokens i components.css; text och kapsel byte-identiska med före.
- [x] #2 Facit-amendering tasks/sessions/bilagor/s114-segmentlistan-konvergens/AMENDERING-2026-09-04-tomlagets-yta.md skriven i samma form som s111:s amendering 2026-09-01: yta, klass, Marcus båda citat (v1-avslag + v2-stämpel), vad som ändrats mot facit.json rad 14 ('ingen grå låda' → vit streckad platta), nya bilder desktop 1440 + mobil 375 i bilagan; facit.json orört (stämpel-PR #2293 äger godkand).
- [x] #3 Grindar gröna: typecheck 0, biome 0 nya fel, build grön, tests/visual/segment-promoverings-grind.spec.ts båda vyportarna; check-facit passerar (markören 'K3 - brickor, korthöjd låst' orörd).
- [ ] #4 PR genom review-loopen (review-agent färsk kontext, sektion, backstopp-preflight) och landad; kortet Done med PR-nummer och merge-SHA i final summary.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
