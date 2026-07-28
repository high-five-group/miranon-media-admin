---
id: TASK-71
title: >-
  Fynd: .claude/** klassas som kod och grindas som ingenting — allowlisten och
  docs-globbarna måste ändras i par
status: Done
assignee: []
created_date: '2026-07-28 18:23'
updated_date: '2026-07-28 20:39'
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
- [x] #1 Mekanismen omverifierad i CI, inte bara lokalt: ett run-ID redovisat där en PR som ENDAST rör en .claude/-fil klassas — före-talet (full svit) hämtat ur historiken, båda talen i PR-texten
- [x] #2 .claude/-posterna tillagda i should_skip_tests-stegets allowlist i ci.yml
- [x] #3 Samma poster tillagda i changed-docs-stegets lista — paret som ci.yml:s egen kommentar gör obligatoriskt
- [x] #4 .claude/**/*.md täcks av ALLA tre docs-grindarna: markdownlint-cli2 globs, lint:prose och check-docs.sh — utdata som visar att filerna faktiskt lintas, inte bara att globben ändrats
- [x] #5 Beslutet om .claude/settings.json (docs-klassad eller utelämnad) fattat och motiverat i PR-texten
- [x] #6 Kontrastbevis: en PR som endast rör .claude/ skippar Test suite OCH kör docs-jobbet grönt — run-ID redovisat
- [x] #7 Inga filer utanför .claude/, ci.yml och docs-grindarnas config rörda
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererat i PR #366 (commit 681aa8e, merge 4543d18), CI grön per jobb. AC 1 och 6 stängda i PR #380, som är kontrastbeviset — de kan strukturellt inte tas av kortets egen PR, eftersom den ändrar ci.yml och därmed per definition faller ur docs-klassningen.

KONTRASTBEVISET, MÄTT 2026-07-28 (körning 30397104750, PR #380 — en diff som rör ENBART .claude/):
  Test suite     : SKIPPED   (.claude/** är docs-klassad — AC 1)
  Docs link check: SUCCESS   (filen ligger innanför docs-grindarnas globbar — AC 6)
Samma diff hade före denna skiva dragit hela staging-sviten, uppmätt till cirka 10 minuter genom den globala mutexen. Fyra historiska commits (ab52cd5, 7b60dc1, b48ece0, 8b98e95) rörde enbart .claude/settings.json och drog kodvägen var och en.

FYNDET UNDER FYNDET: .claude/** matchar INTE .claude/.markdownlint.jsonc — dot-regeln biter en andra gång inuti katalogen. Med bara den ena posten hade agentens egen nya configfil legat utanför båda listorna, alltså samma fail-open återinfört av sin egen fix. Därför två poster: .claude/** och .claude/**/.*, den senare verifierad även mot nästlad dot-sökväg.

PARET SOM VAR HELA POÄNGEN: posterna ligger i BÅDA listorna i ci.yml (should_skip_tests och changed-docs), enligt filens egen obligatoriska par-invariant. Utan paret hade en .md-fil där blivit både testsvit-skippad och docs-ovaliderad — tyst ovaliderad, L322-klassen. Par-invarianten maskinellt kontrollerad: alla åtta docs-verktygs-config-poster finns i båda listorna.

TÄCKNING MÄTT, INTE ANTAGEN: markdownlint 306 -> 308 filer, Vale 435 -> 437. En planterad probe-fil under .claude/agents/ fällde alla tre grindarna samtidigt (check:docs exit 1); borttagen probe gav exit 0 och 9/9 gröna.

WORKTREE-FÄLLAN: varken markdownlint-cli2 eller Vale läser .gitignore. Utan exkluderingarna hade .claude/** dragit in varje aktiv agent-worktrees hela .md-massa, och grinden hade fällt lokalt på en annan grens innehåll. Mätt: vale .claude 4 -> 2 filer.

MD041 LÖSTES UTAN ATT RÖRA AGENTERNAS SYSTEMPROMPT: en H1 i en agentfil hade ändrat prompten för att blidka ett lint-verktyg. Regeln är ompekad till front_matter_title, inte avstängd.

settings.json DOCS-KLASSAD, motiverat: den kan strukturellt inte påverka ett test (CI kör inte Claude Code), och den blir inte ogrindad — biome check . i det alltid-på lint-jobbet traverserar .claude/, bevisat med felformaterad probe-JSON.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
