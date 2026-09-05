---
id: TASK-394
title: >-
  Fynd: eventväljaren visar den lilla pill-formen på åtgärdssidan — den stora
  formen ska gälla överallt (default 'fristaende')
status: Done
assignee: []
created_date: '2026-09-04 10:57'
updated_date: '2026-09-05 11:43'
labels:
  - ready-for-agent
dependencies: []
ordinal: 689000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND (Marcus 2026-09-04, S120 Del 1, verbatim i sessionsdoket): 'Jag stör mig på att åtgärdssidan har den lilla eventväljaren. Vi har infört den stora på typ alla ställen, eller det SKA vara den stora på alla ställen.' FORENSIK (disk 2026-09-04): src/components/events/EventValjare.tsx bär tre former via propen form: 'kontextrad' (DEFAULT, rad ~163 — pill när ett event är valt, stor luftig ruta bara i tomt läge: storForm = tomtLage || form === 'fristaende', rad ~299), 'rubrik' (väljaren ÄR h1:an, EventDetail) och 'fristaende' (den STORA rutan alltid). Åtgärdssidan (src/components/events/atgarder/AtgardsSida.tsx rad ~3002 och ~3065) anropar utan form-prop → pill så fort event är valt. Anrop med form='fristaende' i dag: DokumentYta.tsx ~601 (Marcus 2026-08-18/23), AnmalningarSida.tsx ~513 (S111-facit), OmbokningsSteg.tsx ~280. Anrop med default (pill): AtgardsSida ×2, BetalningsInkorg.tsx ~591, ManuellAnmalanForm.tsx ~160 och ~336, KopplaTillEventDialog.tsx ~127, AnmalningRadResolution.tsx ~145. EventDetail.tsx ~209 form='rubrik' (rörs inte). ORKESTRERARENS FÖRSLAG (kodar regeln i stället för att strö den): byt DEFAULT till 'fristaende' i EventValjare; ta bort 'kontextrad'-formen om ingen konsument längre begär den (över-engineering-vakten: en form utan användare rivs); 'rubrik' kvar. Konsekvens: sju anropsplatser byter form i samma landning — Marcus granskar dem i webbläsaren per yta innan stämpel (dialogerna KopplaTillEventDialog/AnmalningRadResolution och inkorgens filterrad är de platser där den stora rutan kan behöva egen bedömning). FACIT: åtgärdssidan är stämplad (s93-atgardssida-promovering, s100-atgardssidan-varv3/varv4), Hem/inkorgen (s102-hem-konvergens + amendering betalningar-kortet), anmälningssidan (s111) — kör samma kallor-korsläsning som s111:s amendering 2026-09-01 gjorde och skriv amenderings-not per berörd stämplad yta EFTER Marcus stämpel. Källor: S120 sessionsdok Del 1 · EventValjare.tsx docblock § form · DokumentYta.tsx-kommentaren (Marcus 2026-08-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 EventValjare: default form = 'fristaende'; 'kontextrad' riven om noll konsumenter kvar (grep-bevis), annars kvar som explicit opt-in med motivering i docblocket; 'rubrik' oförändrad; docblocket § form uppdaterat med Marcus 2026-09-04-beslutet.
- [x] #2 Åtgärdssidan visar den stora rutan i båda tillstånden (utan valt event och med valt event), mätt i DOM och skärmdump desktop 1440 + mobil 375; sidhuvud/sidram opåverkade.
- [x] #3 Skärmdumpar före/efter för varje anropsplats som byter form (BetalningsInkorg, ManuellAnmalanForm ×2, KopplaTillEventDialog, AnmalningRadResolution) i PR-kroppen — Marcus stämplar per yta eller pekar ut undantag; ett undantag blir explicit form-prop med motivering, aldrig tyst.
- [x] #4 Tester: acceptance-/aria-snapshots som bär pill-formen uppdaterade medvetet i samma landning, diffen redovisad; typecheck 0, biome 0 nya fel, build grön, långa-streck-grinden grön.
- [x] #5 Facit-amendering(ar) skrivna för varje stämplad yta vars kallor rörs (kallor-korsläsning mot git diff, S111-precedentet), med Marcus stämpelcitat; facit.json orörda; check-facit passerar.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landad 2026-09-05 via PR #2319, merge-SHA e677d3dd (11:42Z), Marcus stämpel i webbläsaren 2026-09-05: "Eventväljaren ser bra ut." Review-agent runda 1 (färsk kontext): risk lag, konvergerad; ett info-fynd bokfört: fyra styrande dokument (CONTRIBUTING.md, ORDLISTA.md, docs/byggplan.md, docs/specs/DESIGN-SYSTEM-SPEC.md) bär enbart updated-datumbumpen ur pre-commit-hooken (ADR-030) från merge-synken mot main — DoD #3 bockas mot den öppet bokförda avvikelsen, ingen innehållsändring i filerna. AC #3 klassad felställd av granskaren: KopplaTillEventDialog är död kod (0 konsumenter), rivningen ägs av TASK-400. Facit-amendering: s111-anmalningssidan-konvergens/AMENDERING-2026-09-05-eventvaljarens-stora-form.md (enda stämplade facit vars kallor bär EventValjare.tsx). Skärmdumpar: tasks/sessions/bilagor/s120-eventvaljaren-task394/ (16). Källa: S120 sessionsdok Del 4.
<!-- SECTION:FINAL_SUMMARY:END -->
