---
id: TASK-71
title: >-
  Fynd: .claude/** klassas som kod och grindas som ingenting — allowlisten och
  docs-globbarna måste ändras i par
status: To Do
assignee: []
created_date: '2026-07-28 18:23'
updated_date: '2026-07-28 18:48'
labels:
  - ready-for-agent
dependencies: []
ordinal: 151000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Varje ändring i .claude/ drar i dag hela staging-sviten (~10 min genom den globala mutexen), samtidigt som ingen docs-grind validerar filerna. Posten har stått öppen i restlistans A4 sedan 2026-07-27 som "en rad i allowlisten". Genomläsningen 2026-07-28 visade att den raden ensam skulle skapa ett fail-open.

### MEKANISMEN ÄR BELAGD, INTE ANTAGEN

D0-allowlisten i ci.yml innehåller `**/*.md`, vilket ser ut att täcka .claude/agents/*.md. Det gör den inte: micromatch matchar som default inte dot-kataloger (dot: false). Prövat lokalt mot node_modules/micromatch — `**/*.md` utan dot ger noll träff på .claude/agents/bygg-skiva.md, med dot: true full träff.

Indirekt stöd i ci.yml självt: .github/PULL_REQUEST_TEMPLATE.md och .github/ISSUE_TEMPLATE/** står EXPLICIT i allowlisten trots `**/*.md`. Vore dot-matchning påslagen vore de raderna döda.

VERIFIERA I CI, INTE BARA LOKALT: den lokala micromatch-mätningen visar mekanismen, inte tj-actions/changed-files faktiska konfiguration. Kortets AC 1 kräver ett kontrastbevis ur en verklig körning.

### VARFÖR DET INTE RÄCKER ATT LÄGGA TILL EN RAD

.claude/** ligger utanför SAMTLIGA docs-grindars globbar:
- .markdownlint-cli2.jsonc § globs (docs/**, tasks/*, ./*.md)
- npm run lint:prose (vale docs tasks README.md CHANGELOG.md SECURITY.md CONTRIBUTING.md ORDLISTA.md)
- scripts/check-docs.sh rad 96-97 (samma uppsättning)

Läggs .claude/** bara i allowlisten blir en .md-fil där BÅDE testsvit-skippad OCH docs-ovaliderad, alltså tyst ovaliderad. Det är exakt det fail-open som ci.yml:s egen kommentar kallar den obligatoriska parade ändringen ("varje docs-config-post här måste ALLTID finnas även i changed-docs-stegets lista"), och samma klass som L322.

### DESIGNVAL SOM KORTET SKA AVGÖRA EXPLICIT

.claude/settings.json är JSON och kan inte grindas av markdownlint, Vale eller lychee. Antingen docs-klassas den ändå (motiverat: den kan strukturellt inte påverka ett enda test — CI kör inte Claude Code) eller så begränsas allowlisten till .claude/**/*.md. Välj, och skriv skälet i PR:n. Historiken visar att settings.json-ändringar är de vanligaste: fyra commits rörde enbart den filen.

### EMPIRI

Mätt 2026-07-27: en URL-ändring i agentkonfig kostade full staging-svit. Fyra historiska commits rörde enbart .claude/settings.json (ab52cd5, 7b60dc1, b48ece0, 8b98e95) — samtliga drog kodvägen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Mekanismen omverifierad i CI, inte bara lokalt: ett run-ID redovisat där en PR som ENDAST rör en .claude/-fil klassas — före-talet (full svit) hämtat ur historiken, båda talen i PR-texten
- [x] #2 .claude/-posterna tillagda i should_skip_tests-stegets allowlist i ci.yml
- [x] #3 Samma poster tillagda i changed-docs-stegets lista — paret som ci.yml:s egen kommentar gör obligatoriskt
- [x] #4 .claude/**/*.md täcks av ALLA tre docs-grindarna: markdownlint-cli2 globs, lint:prose och check-docs.sh — utdata som visar att filerna faktiskt lintas, inte bara att globben ändrats
- [x] #5 Beslutet om .claude/settings.json (docs-klassad eller utelämnad) fattat och motiverat i PR-texten
- [ ] #6 Kontrastbevis: en PR som endast rör .claude/ skippar Test suite OCH kör docs-jobbet grönt — run-ID redovisat
- [x] #7 Inga filer utanför .claude/, ci.yml och docs-grindarnas config rörda
<!-- AC:END -->



## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
