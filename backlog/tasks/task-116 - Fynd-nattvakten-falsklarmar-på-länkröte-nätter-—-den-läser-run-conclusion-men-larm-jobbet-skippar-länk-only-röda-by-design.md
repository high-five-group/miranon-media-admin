---
id: TASK-116
title: >-
  Fynd: nattvakten falsklarmar på länkröte-nätter — den läser run-conclusion,
  men larm-jobbet skippar länk-only-röda by design
status: To Do
assignee: []
created_date: '2026-08-01 13:08'
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
- [ ] #1 Grundorsaken åtgärdad i vald form: en natt vars enda röda jobb är länkkontrollen ger INTE ärendet Nattnätet rött utan larm; formvalet motiverat mot åtgärdsrymden och förkastade alternativ bär sina skäl
- [ ] #2 Vaktens äkta larmklasser intakta: startup_failure, utebliven schemakörning och röd natt där larm-jobbet faktiskt uteblivit larmar fortfarande — tvåsidigt bevis, mätt inte resonerat
- [ ] #3 Bevis-läget simulate_missing fungerar efter ändringen, verifierat med en dispatch
- [ ] #4 Ärende #469 stängt enligt stängningsregeln med hänvisning till detta korts leverans
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #6 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #7 CI grön per jobb på pushad commit
- [ ] #8 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
