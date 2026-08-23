---
id: TASK-299.4
title: 'Skiva: Konvergens till godkänd form + facit-stämpel för anmälningssidan'
status: Done
assignee: []
created_date: '2026-08-22 19:20'
updated_date: '2026-08-23 19:22'
labels:
  - ready-for-human
dependencies:
  - TASK-299.3
parent_task_id: TASK-299
ordinal: 544000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Den variant Marcus valde itereras tills han är helt nöjd — konvergensfasen. När formen sitter skapas ett facit-manifest för anmälningssidan i bilage-katalogen s111-anmalningssidan-konvergens, med bilder för sidans tre lägen, och Marcus stämplar det via kanalseparationen (ADR-104). Manifestet ska deklarera vilka bilder som ÄR facit och vilka som är iterationssteg, så nästa läsare aldrig behöver gissa — det är precis den fälla personlistans manifest finns för att stänga. Efter stämpeln är formen låst och byggs aldrig om; den flyttas. Täcker användarberättelser: 3, 4, 5, 6, 7, 14, 15.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Vinnarvarianten itererad till Marcus uttryckliga godkännande i klartext
- [x] #2 Facit-manifest finns på tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json med ytan 'anmälningssidan' och bilder för alla tre lägen (ofiltrerad, åtgärdskö, tomt)
- [x] #3 Manifestet deklarerar uttryckligen vilka bilder som är facit och vilka som är iterationssteg eller förkastade alternativ
- [x] #4 Marcus har stämplat manifestet via kanalseparationen; godkand-fältet bär av, datum, citat och sha
- [x] #5 check-facit grön med det nya manifestet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 axe 0 på varje ny/ändrad yta i alla tillstånd (lista, filtrerat, tomt, fel)
- [x] #6 Höjdlåset verifierat som beteende: rader med/utan status och med/utan åtgärdsbehov har samma höjd
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-23 (S111 resume 2, fönster 1) — AC #1 bockad: vinnarvarianten (B) itererad till Marcus uttryckliga godkännande i klartext. Kedjan: Del 5 *"Ser bra ut. Jag godkänner bevakningsraden och åtgärdskö-raden nu"* (Hems rader) → resume 2: Marcus begärde dokumentsidans eventväljarform + ikon på "Alla event" (*"Jag vill ha den andra eventväljaren som har ett annat utseende, den som sitter på dokument-sidan. Och 'Alla event' kan väl få en ikon då precis som 'Delade dokument' har på dokumentsidan, det blir väl snyggt?"*), byggt i 7ac7b973 (form="fristaende" + CalendarRange), granskat på dev-servern ur worktreen → *"Det blir bra."* Formen som ska in i facit-manifestet = wip/s111-marcus-iteration vid 7ac7b973 (+ ordbytet som följer).

2026-08-23 — AC #4 bockad: Marcus stämplade manifestet via kanalseparationen (npm run facit:godkann, !-prefix, ADR-104): av marcus · datum 2026-08-23 · citat "Det blir bra." · sha d3858a29 (origin/main vid stämpeln). Bilderna som stämplades är de omtagna efter mobilfixen (87438ea6/348c9079). check-facit exit 0 med stämpeln.

STÄNGNING 2026-08-23 (S111 kort-stängningspass). DoD #1-#6 bockade; #5 och #6 med explicit motivering eftersom skivans egen yta är riven.

DoD #1 — AC #1-#5 samtliga bockade före detta pass.
DoD #2 — lokala grindar gröna per byggpasset; check-facit exit 0 med stämpeln.
DoD #3 — CI GRÖN PER JOBB: skivans commits (a8af2f85 manifest + 7 bilder, 87438ea6 mobilfixen, 348c9079 omtagna mobilbilder, 45d2894a stämpeln) landade via PR #1864, merge-commit e1470eb0. `gh pr checks 1864` mätt 2026-08-23: 15 rollup-poster, NOLL fail.
DoD #4 — diffen granskad i detta pass: a8af2f85 rör .facit-policy.conf + kortfilen + 7 PNG + facit.json; 45d2894a rör kortfilen + facit.json; 87438ea6 rör EN fil (prototypens VariantB.tsx). Inga orelaterade filer.

DoD #5 (axe 0 alla tillstånd) och DoD #6 (höjdlåset som beteende) — VAR MÄTNINGEN LEVER, källmärkt. Skivans enda RÖRDA yta var prototypen src/components/dev/anmalningar-prototyp/VariantB.tsx (mobilfixen 87438ea6); manifestet och bilderna rör ingen yta. Den prototypen är sedan RIVEN (ADR-103 B2 steg 4, TASK-299.5 AC #2) och dess acceptance-fil finns inte längre på disk — mätningen kan alltså inte köras om där, och det är avsiktligt: ADR-102:s premiss är att den stämplade formen inte byggs om, den FLYTTAS. Formen lever i skarpa src/components/registrations/AnmalningarSida.tsx och mäts där, i tests/acceptance/mer-anmalningar-form.acceptance.test.ts (disk-verifierat i detta pass):
  · DoD #5, alla fyra tillstånd har eget axe-svep: rad 185 'lista-läget renderar rader och axe 0' · rad 201 'åtgärdskö-läget filtrerar till behoverAtgard och axe 0' (filtrerat) · rad 231 'tomt läge visar vänlig text, inga fel, axe 0' · rad 244 'fel (4xx) visar role=alert, axe 0'. Ytterligare svep på filter-tomläget (rad 645), öppen filterpanel (rad 685) och öppen eventväljare (rad 894).
  · DoD #6, höjdlåset som BETEENDE: rad 305 'DoD #6 — höjdlåset: rader med och utan åtgärdsbehov har samma höjd', mätt med boundingBox() på en OK-rad mot en åtgärdsrad — inte som påstående.
  · Den sviten kördes grön i CI på PR #1864 (Acceptance hermetisk pass, 8m54s).
TASK-299.5 bär samma två poster bockade av sitt eget promoveringspass; detta kort ärver alltså inte en omätt post — det pekar på var mätningen faktiskt gjordes.
<!-- SECTION:NOTES:END -->
