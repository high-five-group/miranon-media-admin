---
id: TASK-17.4
title: 'Skiva: Kalendervyn till S72-facit'
status: In Progress
assignee: []
created_date: '2026-07-21 08:19'
updated_date: '2026-07-21 21:49'
labels:
  - ready-for-agent
dependencies:
  - TASK-17.2
  - TASK-17.3
parent_task_id: TASK-17
ordinal: 45000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Listan får facitets kalendervy: vy-ikon-toggel (lista förvald) med ?vy=kalender i URL:en, React Aria Calendar-motorn med FK-skinnet, solida dag-plattor i exakt legendens kulör, månadsnav som ersätter period-toggeln i kalenderläget, månadssummeringen med kursfärgs-streck, dag-tryck som visar dagens event som kort med retur till hela månaden; vald dag guld med mörk ring. Täcker användarberättelser: 10-12, 15-18 (TASK-17).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Kalendervyn matchar FACIT-kalendervyn renderat; dag-plattornas kulör == legendens exakt (computed-verifierat)
- [x] #2 ?vy-kontraktet och dag-flödet bevisade i e2e; kalenderns dagar annonseras begripligt och vyn klarar axe-0
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Levererad i S75-batchen v2 (parallell form, ADR-073): kalendervyn till S72-facit — vy-ikon-toggeln (ToggleButtonGroup-primitiven, ikon-piller Listvy/Kalendervy, lista förvald med ren URL) + ?vy=kalender (nuqs, history push, clearOnDefault; URL-STATE-SPEC §Event omskriven), ny vy-lokal EventsCalendar (React Aria Calendar-motorn + FK-skinnet: månadsnav-kapseln ERSÄTTER period-toggeln, solida dag-plattor i EXAKT legend-kulör via kursfargForKurs-uppslaget [17.3, ADR-064 — ingen namn-matchning], legend, månadssummeringen med kursfärgs-streck/korta kursnamn/Annat-eventnamn, dag-tryck → EventCard-kort + Visa hela månaden-retur, vald dag guld --mm-primary + mörk ring --mm-text, Lugnt laddläge: grid i slutgeometri + skeleton-summeringsrader). Manifest: @internationalized/date deklarerad som direkt-beroende, pinnad 3.12.2 ur lockfilens transitiva post (fanns redan som fantom-import i OmEventet). TDD rött-först: 8 e2e-tester, 8/8 röda före implementation (fail på saknad vy-toggel/grid), 8/8 gröna efter; hela list-ytan 20/20 (17.2-sviten regressionsfri). Facit-avprickningen (renderad, L245/L246): computed i e2e — platta==legend-prick==token exakt (rim1/fjärrskådning/annat), spannet 17–18 båda färgade, tom dag --mm-bg-muted, plattans text --mm-text-inverse semibold, vald dag bg==--mm-primary + boxShadow bär --mm-text, streck==token; skärmdumpar 390×844 mot bilagan (kalendervyn+dagval+listvyn, juli 2026 == facit-månaden: 17/18/31 RIM1-gröna som i FACIT-kalendervyn). SR-noter: veckodagsraden är aria-hidden per react-aria-mönstret (cellernas fullständiga sv-datum-namn bär kartan — begripligt-kravet bevisat via aria-label + aria-selected + sv-lokaliserade navknappar Nästa/Föregående); månadssummeringen är färgens icke-visuella paritet (story 12). Grindar: biome 0 · typecheck 0 · test:api 303/303 · build grön · e2e 20/20 · markdownlint+vale 0 på rörd docs-fil. Väntar design-review (S75-batchen v2).

CI grönt per jobb: PR-run 29870508571 + main-run 29871006378 (S75-batch v2)
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S72-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
<!-- DOD:END -->
