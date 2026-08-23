---
id: TASK-299.4
title: 'Skiva: Konvergens till godkänd form + facit-stämpel för anmälningssidan'
status: To Do
assignee: []
created_date: '2026-08-22 19:20'
updated_date: '2026-08-23 14:54'
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
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 axe 0 på varje ny/ändrad yta i alla tillstånd (lista, filtrerat, tomt, fel)
- [ ] #6 Höjdlåset verifierat som beteende: rader med/utan status och med/utan åtgärdsbehov har samma höjd
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-23 (S111 resume 2, fönster 1) — AC #1 bockad: vinnarvarianten (B) itererad till Marcus uttryckliga godkännande i klartext. Kedjan: Del 5 *"Ser bra ut. Jag godkänner bevakningsraden och åtgärdskö-raden nu"* (Hems rader) → resume 2: Marcus begärde dokumentsidans eventväljarform + ikon på "Alla event" (*"Jag vill ha den andra eventväljaren som har ett annat utseende, den som sitter på dokument-sidan. Och 'Alla event' kan väl få en ikon då precis som 'Delade dokument' har på dokumentsidan, det blir väl snyggt?"*), byggt i 7ac7b973 (form="fristaende" + CalendarRange), granskat på dev-servern ur worktreen → *"Det blir bra."* Formen som ska in i facit-manifestet = wip/s111-marcus-iteration vid 7ac7b973 (+ ordbytet som följer).

2026-08-23 — AC #4 bockad: Marcus stämplade manifestet via kanalseparationen (npm run facit:godkann, !-prefix, ADR-104): av marcus · datum 2026-08-23 · citat "Det blir bra." · sha d3858a29 (origin/main vid stämpeln). Bilderna som stämplades är de omtagna efter mobilfixen (87438ea6/348c9079). check-facit exit 0 med stämpeln.
<!-- SECTION:NOTES:END -->
