---
id: TASK-116
title: >-
  Fynd: nattvakten falsklarmar på länkröte-nätter — den läser run-conclusion,
  men larm-jobbet skippar länk-only-röda by design
status: Done
assignee: []
created_date: '2026-08-01 13:08'
updated_date: '2026-08-26 04:14'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 188000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Bokfört läge, verifierat mot källorna 2026-08-01

`nightly-watchdog.yml` (rad 116–118) fyrar rubriken **"Nattnätet rött utan larm"** när senaste schemalagda nattkörningen har `conclusion != success` och inget öppet `ci-natt`-ärende finns. Orsakstexten antar att *"larm-jobbet kan självt ha uteblivit"*.

Men sedan ADR-082 flyttades den externa länkkontrollen till nattnätet med **egen ärende-kanal**: larm-jobbet `alarm` i `nightly.yml` (rad 424) har `needs: [suite, nightly-audit, nightly-metrics, kontraktsvakt, backlog-closure]` — **länkjobbet ingår INTE i needs**. En natt vars enda röda jobb är Länkkontroll (utan cache) ger därför `alarm: skipped` **by design** (länkrötan bärs av stående ärendet, jobb `links-arende`), medan körningens run-conclusion ändå blir `failure`.

Vakten ser alltså exakt det läge som är korrekt konstruerat — röd run-conclusion, inget ci-natt-ärende — och klassar det som utebliven larmkedja. **Varje länkröte-natt utan öppet ci-natt-ärende blir ett falsklarm**, i direkt strid med vaktens egen husregel (rad 83–84: *"ett falsklarm är värre än ingen vakt"*).

## Empiri — observationen är skarp, inte teoretisk

- **Ärende #469** (🌑 Nattnätet rött utan larm — 2026-07-30): vakten larmade på run 30513174298. Jobben verifierade 2026-08-01: **enda röda jobbet var Länkkontroll (utan cache)**; `Larm vid röd natt: skipped`. Larm-jobbet uteblev inte — det skippade korrekt. Falsklarm, bokstavligen vaktens första skarpa avfyrning.
- **Run 30683902551** (natten 2026-08-01): samma mönster — länk-only-röd, alarm skipped. Vakten teg den dagen ENBART för att #469 råkade stå öppet (dedup räknar öppna ci-natt-ärenden, rad 130–135). Dedupen är alltså det enda som just nu dämpar falsklarmsklassen, och den dämpar bara så länge ett äldre ärende står öppet.

## Åtgärdsrymden — ÖPPEN, formval hör till kortets exekvering

Möjliga former, ingen vald här: (a) vakten läser **jobb-nivå** i stället för run-conclusion och undantar nätter vars enda röda jobb är länkkontrollen; (b) vakten undantar röda nätter när larm-jobbets conclusion är `skipped` (skip = medvetet beslut, utebliven = frånvarande); (c) larm-kedjan görs om så länk-only-nätter inte färgar run-conclusion (kräver ändring i nightly.yml — större yta). Formvalet ska vägas mot vaktens SRE-grund (rad 17–21) och bevis-läget `simulate_missing` måste överleva ändringen.

## Sekvens

**Exekvering: efter S91-kärnan** (gränsregeln, minting-uppdraget 2026-08-01). Kortet är plockbart i sak men ska inte plockas före S91-kärnan är landad.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Grundorsaken åtgärdad i vald form: en natt vars enda röda jobb är länkkontrollen ger INTE ärendet Nattnätet rött utan larm; formvalet motiverat mot åtgärdsrymden och förkastade alternativ bär sina skäl
- [x] #2 Vaktens äkta larmklasser intakta: startup_failure, utebliven schemakörning och röd natt där larm-jobbet faktiskt uteblivit larmar fortfarande — tvåsidigt bevis, mätt inte resonerat
- [x] #3 Bevis-läget simulate_missing fungerar efter ändringen, verifierat med en dispatch
- [x] #4 Ärende #469 stängt enligt stängningsregeln med hänvisning till detta korts leverans
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #6 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #7 CI grön per jobb på pushad commit
- [x] #8 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC-AVSTÄMNING MOT S97-FIXEN 2026-08-05 (orkestreraren). Kortet är NÄSTAN klart av arbete som redan är landat — men inte helt, och stängs därför INTE.

BELAGDA av commit 39e55a58 (S97, 2026-08-04), bockade:
- AC #1 ✅ Grundorsaken åtgärdad: vakten frågar nu vilka JOBB som var röda och bortser från dem som per konstruktion inte bär alarm-jobbet. Formvalet motiverat i commit-bodyn mot dedup-resonemanget, med fail-closed behållet ('vet inte' får aldrig bli tyst).
- AC #2 ✅ Tvåsidigt bevis MOT VERKLIG HISTORIK, inte konstruerad rigg: filtret ger tom sträng för alla fyra falsklarms-körningarna och fångar de alarm-bärande röda jobben i båda de äkta. Sex röda nattkörningar granskade. Kommandon och utfall i sessionsdok S97 Del 4.
- AC #4 ✅ Ärende #469 stängt 2026-08-04T16:33:12Z.

EJ BELAGT, lämnas obockat:
- AC #3 ❌ 'Bevis-läget simulate_missing fungerar efter ändringen, verifierat med en dispatch.' Ingången finns kvar i .github/workflows/nightly-watchdog.yml (rad 47, 78, 97, 187), men INGEN dispatch-verifiering efter ändringen är dokumenterad: sessionsdok S97 har NOLL träffar på 'simulate_missing', och commit-bodyn säger tvärtom uttryckligen 'ej konstruerad rigg'. Beviset kan alltså ha utförts utan att bokföras, eller inte alls — och den skillnaden går inte att avgöra ur artefakterna.

ÅTERSTÅENDE ARBETE: en simulate_missing-dispatch mot vakten efter 39e55a58, med run-länk bokförd. Det är hela kortets rest. Kör den, bocka AC #3, stäng.

Varför kortet inte stängs på tre av fyra: att bocka ett obelagt AC för att kortet 'känns klart' är precis den klass av påstående utan mekanism som ADR-083 vaktar mot.

AC #3 BELAGT 2026-08-26 (S112 fix-våg 4, bunt A). simulate_missing-dispatch kört mot .github/workflows/nightly-watchdog.yml på origin/main (post 39e55a58): gh workflow run nightly-watchdog.yml --ref main -f simulate_missing=true → run https://github.com/high-five-group/miranon-media-admin/actions/runs/32923517894 (conclusion success). Vaktkedjan fungerade end-to-end: dispatchen skapade issue #1975 ("🌑 Nattvakten — BEVIS-LÄGE — 2026-08-26", etikett ci-natt, assignee marcus803) med kroppens SIMULERAT-notering intakt. Issue stängd samma pass med motiveringen "Stängs enligt vaktens egen anvisning: SIMULERAT via simulate_missing-dispatch (run 32923517894) för TASK-116 AC #3 ...". Ingen kodändring krävdes — beviset var det enda återstående. Alla fyra AC nu belagda; DoD (CI grön per jobb / PR) lämnas till orkestreraren att verifiera efter push.

DoD-avstämning S112 resume 1 (2026-08-26, stängnings-batch 1). DoD #1/#5 (AC avbockade): 4/4 AC bekräftat [x] — check. DoD #2/#6 (rörd fil-klass lokala grindar gröna): commit 39e55a58 (grundorsaksfixen) bär i sin egen commit-body 'Grindar: actionlint EXIT=0 · yamllint EXIT=0 · shellcheck-strict över hela scopet EXIT=0'; dagens simulate_missing-dispatch (run 32923517894) conclusion=success — check. DoD #4/#8 (inga orelaterade filer): git show --stat 39e55a58 bekräftar EXAKT 1 fil ändrad (.github/workflows/nightly-watchdog.yml, 50 insertions/2 deletions) — check. DoD #3/#7 (CI grön per jobb) lämnas obockade, härledda via landningspekaren nedan.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landning: PR #1978. Done-flipp S112 resume 1, 2026-08-26, post-merge efa98ffe74a4 success.
<!-- SECTION:FINAL_SUMMARY:END -->
