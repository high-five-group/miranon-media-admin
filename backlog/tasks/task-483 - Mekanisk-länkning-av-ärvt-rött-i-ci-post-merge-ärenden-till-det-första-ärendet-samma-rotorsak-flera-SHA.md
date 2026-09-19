---
id: TASK-483
title: >-
  Mekanisk länkning av ärvt rött i ci-post-merge-ärenden till det första ärendet
  (samma rotorsak, flera SHA)
status: To Do
assignee: []
created_date: '2026-09-19 11:53'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 838000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-479.2 (SE16) AC #3 begärde att ett ärvt rött — samma felande test/jobb som redan spårat i ett äldre öppet `ci-post-merge`-ärende — pekas mot DET ärendet i stället för att ge ett nytt revert-förslag mot fel landning. AC #3 tillät uttryckligen en escape-klausul ("eller, om det inte går mekaniskt, är begränsningen utskriven och kortad") eftersom en korrekt lösning kräver att veta VILKET TEST som föll, inte bara vilket JOBB (`needs`-resultatets pass/fail är jobb-granulärt) — det kräver att parsa jobbets logg-utdata, ett nytt beroende som inte fanns i TASK-479.2s scope (dess Testbeslut-sektion nämner bara svepets egen rapportering, ingen ny script+testsvit för detta). Skarpt exempel 2026-09-19: fyra öppna `ci-post-merge`-ärenden (#2573, #2575, #2578, #2582) på FYRA olika SHA:n, alla med "suite (failure)" och attributionstexten "var redan RÖD" — men ingen länkning till varandra. Lösningsskiss: utöka `scripts/post-merge-attribution.sh` (redan testad, redan skarpt bevisad) eller ett nytt syskonskript att (a) hämta job-nivå "Röda jobb"-strängen för ÖVRIGA öppna ci-post-merge-ärenden via `gh issue list --label ci-post-merge --state open`, (b) jämföra mot den aktuella körningens `roda`-jobb, (c) vid träff peka mot den ÄLDSTA matchande öppna posten i stället för (eller utöver) revert-förslaget. Kräver egen testsvit (samma gatekeeper-mönster som `scripts/test-post-merge-attribution.sh`) eftersom `post-merge.yml`s inline-bash inte kan prövas tvåsidigt (se filens egen kommentar). Källa: `backlog/tasks/task-479.2`, `CONTRIBUTING.md` § Tidsregel och ägare (SE16).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ett nytt öppet ci-post-merge-ärende med samma "Röda jobb"-uppsättning som ett redan öppet ci-post-merge-ärende pekar mot det ÄLDSTA öppna ärendet i stället för (eller utöver) ett revert-förslag mot den nya landningen
- [ ] #2 Mekanismen är tvåsidigt bevisad i en egen testsvit (samma gatekeeper-mönster som scripts/test-post-merge-attribution.sh), CI-wirad
- [ ] #3 post-merge.yml:s befintliga per-SHA-dedup (§ Dedup, gh issue comment på exakt SHA-träff) är orörd — detta är ett SEPARAT, bredare jobb-nivå-fynd, inte en ersättning
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
