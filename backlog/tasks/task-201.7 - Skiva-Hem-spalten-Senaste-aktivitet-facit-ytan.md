---
id: TASK-201.7
title: 'Skiva: Hem-spalten Senaste aktivitet (facit-ytan)'
status: Done
assignee: []
created_date: '2026-08-11 20:26'
updated_date: '2026-08-13 15:31'
labels:
  - ready-for-agent
dependencies:
  - TASK-201.3
  - TASK-201.5
  - TASK-201.6
parent_task_id: TASK-201
ordinal: 372000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: hem-vyn på desktop får sin sista facit-sektion — de senaste aktivitetsposterna i exakt K10-form, länkade till fulla historiken. AC pekar på facit, aldrig på delförändringar (ADR-102 B5). OBS Done-flipp: DoD-posten om facit-identitet kan endast Marcus bocka av (stämplingskanalen npm run facit:godkann är hans, ADR-104) — skivan byggs och landas AFK, granskningen är ett Marcus-moment efteråt.

Täcker användarberättelser: 2, 3, 5, 6
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Hem-spalten är identisk med facit tasks/sessions/bilagor/s55-hem-konvergens/facit.json ytan "hem-historikspalten (Senaste aktivitet)" — bilden k10-facit-desktop.png (ADR-102 B5)
- [x] #2 Spalten renderas ENDAST ≥xl; under xl ingen spalt (historiken nås via Mer per B7); brytpunktsgapet lg↔xl avgörs mot facit-bilden och utfallet bokförs i skivans notes (öppet i manifestet)
- [x] #3 Länken "Se all aktivitetshistorik ›" navigerar till kärnvyn (201.6)
- [x] #4 ariaSnapshot-referenser skapade för spalten (ADR-103-mönstret) OCH manifestets kallor för spaltytan uppdaterade med de nya källfilerna i samma landning
- [x] #5 aria-label bär sektionsnamnet (ingen visuell rubrik); INGA ikoner i posterna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Hem-spalten identisk mot facit-manifestets k10-bild (ADR-102 B5) — Marcus-granskad; manifestet: tasks/sessions/bilagor/s55-hem-konvergens/facit.json
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MARCUS-BESLUT 2026-08-12 (S105 resume 3) — separatorn i hem-spaltens aktivitetsrader: MITTPUNKT `·`, inte långt tankestreck.

Kollisionen som blockerade skivan: facit-bilden `tasks/sessions/bilagor/s55-hem-konvergens/k10-facit-desktop.png` visar långt tankestreck (—) som separator i alla fyra aktivitetsrader, medan grinden `check-langa-streck` förbjuder det och policyns `_readme` citerar Marcus 2026-08-09: 'ALLA 15 långa bindestreck i användarsynlig text MÅSTE bort' (undantagslistan tömdes då). Två Marcus-beslut stod mot varandra.

Marcus avgjorde i klartext 2026-08-12: 'Inga långa bindestreck får användas, larmar det bara på det så är det ok.' Undantagsvägen i policyn är därmed utesluten, och facit-grindens larm på just denna skillnad är ACCEPTERAT — facit följs inte på den punkten. Valet mellan kort bindestreck och mittpunkt föll på mittpunkt `·`, eftersom den redan är appens separator i samma vy (orkestrerarens rekommendation, ej överprövad).

Skivan är därmed AVBLOCKERAD. Beroendet TASK-201.6 (kärnvyn) kvarstår.

UTFÖRT 2026-08-12 (TASK-201.7). Spalten PROMOVERAD ur K10-prototypen (AktivitetK10 i src/components/hem/prototype/K10.tsx, commit bb31a12) enligt ADR-103 B1/B2 — klasser, element och ordning verbatim; endast datakällan bytt, till useLatestActivity(4) (TASK-201.5).

AC #2 — BRYTPUNKTSGAPET lg-till-xl ÄR AVGJORT: ingen spalt i gapet. Grund: facit-prototypens EGET villkor är "hidden ... xl:flex", och xl är den enda brytpunkt som finns nedskriven i låst form; en spalt som ryms i gapet är inte en spalt facit visar. Gapet är ändå ingen lucka — TabBar (src/components/AppShell/TabBar.tsx rad 55) bär inga brytpunktsvillkor alls (endast print:hidden), så Mer, och därmed /mer/aktivitetshistorik via NavCard i src/routes/_authenticated/mer/index.tsx rad 98, är nåbart på VARJE bredd. Byggkrav B7:s "under lg"-formulering täcker alltså hela gapet i praktiken. Bevisat mekaniskt vid 1279 px och 1024 px i tests/acceptance/hem-senaste-aktivitet.acceptance.test.ts.

ANTAL RADER: fyra, som facit-bilden visar. TASK-201.5 delegerade uttryckligen talet hit (hookens filhuvud).

TRE AVVIKELSER FRÅN FACIT-BILDEN, samtliga öppet bokförda i facit.json:
1. Separatorn är mittpunkt — den planerade, i förväg accepterade avvikelsen (Marcus-order ovan).
2. Länkens chevron bärs av ett aria-hidden-span (CTA-precedenten i samma vy): visuellt identiskt, tillgängligt namn utan skiljetecken.
3. Transparent kantlinje tillagd för prefers-contrast: more och print (app-regeln för tonala ytor, Hem.tsx § A11y). Osynlig i normalläget, layoutstabil.

FYND, EJ ÅTGÄRDAT (utanför skivans mandat): AC #4:s ariaSnapshot-referenser fungerar bara i tests/visual. Acceptance-projektets egen expect ERSÄTTER (mergar inte) top-nivåns expect, så toMatchAriaSnapshot.pathTemplate gäller inte där — mekanismen står utskriven i playwright.config.ts rad cirka 47-50. Mätt: en körning lade referensen i tests/acceptance/__screenshots__/ som en acceptance-darwin.aria.yml, alltså via snapshotPathTemplate med platform-segmentet, en darwin-artefakt CI (linux) aldrig hade hittat. Artefakten är borttagen igen. Dessutom körs tests/visual INTE av blockerande CI (enda träffen på test:visual i .github/workflows/ är visual-baselines.yml, workflow_dispatch med update-snapshots). Det blockerande skyddet för spalten är därför acceptance-filens struktur-assertioner: landmärke plus namn, radantal, ikon-frånvaro, separator, brytpunkt.

FIXTURVÄRLDEN: get-activity-log flyttad till NORMALLÄGET (tests/support/fixturvarld/handlers.ts). Nödvändigt, inte valfritt: spalten hämtar vid varje hem-rendering från xl och uppåt, och acceptance-projektet kör 1280x720, så ett omockat anrop hade fällt varje befintligt hem-test via hermetik-vakten. Filhuvudet i mer-aktivitetshistorik.acceptance.test.ts rättat i samma landning, eftersom dess påstående om normalläget blev falskt.

VISUELL BASLINJE: tests/visual/__screenshots__/hem.spec.ts är nu inaktuell — hem-ytan har fått en sektion. Den tas om FÖRST efter Marcus godkännande, per ADR-103 B4. Inte i denna landning.

GODKÄNNANDE: facit.json-fältet godkand är ORÖRT (null). Identiteten mot k10-facit-desktop.png är Marcus eget moment (ADR-104); stämplingskanalen har inte anropats av agenten.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
S105 stängning (uppdrag: promovera hem-spalten efter Marcus godkännande). Två återstående punkter avklarade:

1) VISUELL BASLINJE (ADR-103 B4) — vald väg: workflow_dispatch mot visual-baselines.yml, INTE lokal körning. Motivering: (a) ADR-103 B4 säger uttryckligen "baslinjen tas om ... via CI-artefakt"; (b) workflowns eget filhuvud dokumenterar varför lokalt är fel väg: "referensbilderna genereras i SAMMA miljö de jämförs i (ubuntu-linux — en Mac-bild matchar aldrig en linux-jämförelse)" — denna worktree kör macOS. Triggad (run 31714504314, grönt på 3m3s) → öppnade PR #1249 "test(visual): baseline-uppdatering ur CI (7 bilder)". Innehåller tests/visual/__screenshots__/hem.spec.ts/hem-visual-desktop-linux.png (förväntat — hem-ytan fick sektionen). hem-visual-mobile-linux.png OFÖRÄNDRAD, konsistent med manifestets not att spalten inte visas på mobil. OVÄNTAT FYND (registrerat, ej åtgärdat — utanför denna skivas mandat): PR #1249 bär även 5 bilder från 3 ORELATERADE ytor (event-anmalda, eventsida, personer, desktop+mobil) — ackumulerad baseline-drift workflown fångade eftersom den kör HELA test:visual-sviten, inte skopad till hem. PR #1249 väntar Marcus/orkestrerar-granskning (GRANSKNINGSPLIKT i PR-body) och dess CI står i approval-required-läge (GITHUB_TOKEN-genererad PR) — jag varken godkänner bilderna eller mergar PR:en, det är ett människo-moment (samma mönster som facit-godkännandet).

2) DoD #5 (facit-identitet, Marcus-granskad): belägg = tasks/sessions/bilagor/s55-hem-konvergens/facit.json-fältet godkand, committat d3f29523 ("docs(facit): [S105] s55-hem-konvergens godkand av Marcus"), mergat till main via PR #1248 → commit 91601d8b (2026-08-13T15:15:07Z), verifierat via git show origin/main. PREMISS-AVVIKELSE (ADR-086, rapporterad ej tyst byggd vidare på): uppdraget beskrev stämplingen som en OCOMMITTAD M-fil i huvudkatalogens arbetsträd — faktiskt fynd var en COMMITTAD, PUSHAD PR (#1248), som mergade till main UNDER denna sessions gång (var fortfarande OPEN vid första kontrollen, MERGED vid omkontroll). Substansen (Marcus godkännande finns, citatet matchar) var korrekt — bara transportformen (arbetsträd vs PR) var fel beskriven.

3) DoD #3 (CI grön per jobb): belägg = PR #1236 (commit 675fed40, ursprungslandningen) — samtliga 14 checks SUCCESS eller avsett SKIPPED (Staging sentinel purge / A11y / Staging E2E — villkorade jobb), mergad 2026-08-12T21:42:39Z via kön. Plus denna stängningscommits egen CI, verifierad grön före armering (se PR nedan).

Ingen rivningsbar variant-kod hittad: src/components/hem/prototype/ finns inte (ls: No such file or directory). Kvarvarande "K10"-träffar i src/components/hem/*.tsx är samtliga kommentarer som pekar mot facit-specen — verifierat via grep, ingen är villkorad kod eller flagga.

Rörda filer i DENNA commit: enbart backlog/tasks/task-201.7*.md (kort-stängning). Ingen src-ändring behövdes.
<!-- SECTION:FINAL_SUMMARY:END -->
