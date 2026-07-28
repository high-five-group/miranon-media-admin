---
id: TASK-70
title: 'PRD: Arbetsflödes-gapet — integrationsläget och verifieringsläget särskiljs'
status: To Do
assignee: []
created_date: '2026-07-28 16:31'
labels:
  - ready-for-human
dependencies: []
ordinal: 143000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Integrationsläget och verifieringsläget är hoptryckta till EN obligatorisk PR-grind. Mätt kritisk väg för en kod-PR är 445 s (7,4 min) — run 30369011230 — varav Staging (API + E2E) ensamt bär 375 s plus den globala mutexen staging-tests (ci-suite.yml rad 300-302). Docs-PR:er ligger redan på 53-79 s. Riskklassningen fungerar alltså (D0/D1/acceptance_local/dedup, ci.yml rad 33-46 + 523 + 542); det är kodvägen som bär hela verifieringslagret.

Efter merge finns i praktiken ingenting: dedup_hit (ci.yml rad 519-523) gör att en main-push vars träd redan bevisats grönt hoppar över hela svit-anropet — main-push kör alltså MINDRE än PR:en gjorde. Mellan merge och nattkörningen finns inget andra skyddslager.

Källa: docs/research/arbetsflode-granskning-2026-07-28.md. Karta: tasks/s91-restlistan.md § A7.

### Lösning

Sex skivor som skiljer de två lägena åt:

- ett post-merge-lager byggs (förkrav),
- revert-vägen skrivs och övas (förkrav),
- Staging (API + E2E) och A11y (axe-runner) flyttas ur den blockerande PR-grinden till det lagret,
- landnings-ordningen mekaniseras med merge queue,
- delete_branch_on_merge sätts till true.

### ORDNINGEN ÄR EN INVARIANT, INTE EN PREFERENS

Post-merge-lagret OCH revert-vägen är förkrav för BÅDA flyttarna. Flyttas en kontroll ur grinden innan lagret finns och innan fel kan backas snabbt, tas KONTROLLEN bort i stället för VÄNTAN — precis det granskningen varnar för: eliten tar inte bort kontrollen, de tar bort väntan.

### Avgränsning

A7:1 (ärende #332) och A7:2 (spawn-loggens fält) mintas INTE som kort — de tas utan kort.

Acceptance-urval är kandidat, EJ beslutad: jobbet bär 404/407/452 s mätt (ci-suite.yml rad 137-139) och blir ny kritisk väg när staging lämnat grinden. Det ska inte designas förrän post-merge-lagret mätts skarpt, annars optimeras fel led.

### Rörs inte

Main-skyddet (ruleset 19627609, bypass_actors tom, strict required check), riskklassningen, fail-closed-aggregatorn med gate-proof.yml-beviset, nattnätets larmkedja, worktree-isoleringen, acceptance-klassens utbrytning ur mutexen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Efter samtliga sex skivor innehåller en kod-PR:s CI-körning varken Staging (API + E2E) eller A11y (axe-runner) i sin jobblista — mätt med gh run view --json jobs, run-ID och tal redovisade
- [ ] #2 Ett post-merge-lager kör på push till main och är INTE listat i required_status_checks för ruleset 19627609 — verifierat mot gh api
- [ ] #3 nightly.yml kör fortfarande full svit inklusive staging: dess anrop av ci-suite.yml utan run_staging-input är orört
- [ ] #4 Revert-vägen är skriven i CONTRIBUTING.md och övad minst en gång, med PR-nummer och SHA redovisade
- [ ] #5 Landnings-ordningen är mekaniserad — eller, om mekaniseringen faller, är spärren dokumenterad med belägg i stället för lämnad öppen
- [ ] #6 CI Passed or Skipped är fortfarande enda required check och fortfarande fail-closed: gate-proof.yml körd grön efter sista ci.yml-ändringen
- [ ] #7 Ingen av de sex bekräftat starka mekanismerna är rörd (main-skyddet, riskklassningen, aggregatorn, nattnätet, worktree-isoleringen, acceptance-utbrytningen)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
KLASSNING: ready-for-human.

PRD-kortet exekveras inte — det sekvenserar. Dess innehåll är beslutet om ordning mellan sex skivor, och ordningen är en invariant vars brott inte syns i någon grind: A7:4 och A7:7 före A7:5 och A7:6. Den som plockar korten måste se hela kön, vilket är orkestrerarens och Marcus yta, inte en bygg-agents.

Repots precedens för human-klassning är densamma (TASK-36.7): etiketten används när utförandet kräver omdöme agenten strukturellt inte kan leverera — inte när arbetet är svårt.

Marcus har redan godkänt hela åtgärdsplanen. Beslutet som sådant är taget; klassningen gäller bara utförandet.
<!-- SECTION:PLAN:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
