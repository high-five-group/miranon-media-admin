---
id: TASK-70.2
title: 'Skiva: Post-merge-lagret på main — förkrav för att flytta något ur PR-grinden'
status: To Do
assignee: []
created_date: '2026-07-28 16:32'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-70
ordinal: 145000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FÖRKRAV FÖR A7:5 OCH A7:6. Utan detta lager finns inget skyddsnät att flytta kontroller TILL.

I dag finns i praktiken ingen verifiering efter merge. dedup_hit (ci.yml rad 519-523) gör att en main-push vars träd redan bevisats grönt i PR:en hoppar över hela svit-anropet — main-push kör alltså MINDRE än PR:en gjorde. Mellan merge och nattkörningen (nightly.yml, cron 0 3 varje natt) finns ingenting.

### OMFATTNING

Ny fil .github/workflows/post-merge.yml som triggar på push till main och kör det verifierande lagret. Skivan är ADDITIV: den tar inte bort något ur PR-grinden. Flyttarna är A7:5 och A7:6, och de har detta kort som dep.

Rött post-merge ska öppna ett tilldelat ärende med revert-förslag. Formen finns redan att kopiera: nightly.yml jobbet alarm (rad 322) och jobbet links-arende (rad 150).

### SKARV MOT BEFINTLIG MEKANIK — LÄS FÖRE DESIGN

1. ci.yml kör REDAN på push till main (rad 7-8). Post-merge-lagret får inte dubblera det ci.yml gör, och får inte heller förlita sig på det: dedupen släcker just de tunga jobben.
2. ci-suite.yml är EN KÄLLA, delad av ci.yml (presubmit) och nightly.yml (fullsvit). Anropas den härifrån ärvs den delningen. Läs kommentaren i ci-suite.yml rad 4-19 innan något ändras där.
3. Mutexen staging-tests (ci-suite.yml rad 300-302) är en global FIFO över allt som rör staging — PR, main-push och natt. Ett post-merge-jobb som kör staging köar i samma kö och konkurrerar med PR-körningar.
4. Får INTE bli required check. Rulesetet 19627609 har exakt en: CI Passed or Skipped. Hela poängen med lagret är att det inte blockerar.
5. fetch-depth-invarianten (scripts/check-fetch-depth-invariant.sh) räknar EXPECTED_CI_CARRIERS=3 och läser ENBART ci.yml — en ny fil ligger utanför den namngivna mängden och bryter alltså inte grinden. Behöver post-merge git-historik gäller ändå samma fetch-depth 0-krav som ci.yml:s bärare.

### VAD SOM MÅSTE MÄTAS OCH SKRIVAS NER

Tiden från merge till post-merge-svar. Det talet är exponeringsfönstret — hur länge ett fel kan ligga oupptäckt i main — och det är siffran A7:5 och A7:6 lutar sig mot när de tar bort blockerande kontroller. Utan den mätningen är de två skivorna obelagda.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 .github/workflows/post-merge.yml finns, triggar på push till main och kör grönt — run-ID redovisat
- [ ] #2 Jobbet är INTE listat i required_status_checks för ruleset 19627609 — verifierat mot gh api EFTER landning, utdata redovisat
- [ ] #3 PR-grinden är ORÖRD av denna skiva: en kod-PR:s jobblista är identisk före och efter, och CI Passed or Skipped har oförändrade needs
- [ ] #4 Tvåsidigt bevis: lagret är visat FÄLLA på en avsiktligt bruten commit — i gate-proof.yml:s form — inte bara visat grönt
- [ ] #5 Rött post-merge öppnar ett tilldelat ärende med revert-förslag, bevisat skarpt med ärendenummer redovisat
- [ ] #6 nightly.yml är orörd: dess anrop av ci-suite.yml utan run_staging-input kör fortfarande full svit
- [ ] #7 Tiden från merge till post-merge-svar är mätt i CI och redovisad som tal — det är exponeringsfönstret A7:5 och A7:6 lutar sig mot
- [ ] #8 Antalet körningar som tar concurrency-gruppen staging-tests per landad kod-PR är mätt före och efter, och ökningen redovisad
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
KLASSNING: ready-for-agent.

Skivan är additiv och mekaniskt verifierbar rakt igenom: en ny workflow-fil, ett run-ID som visar grönt, ett gh api-svar som visar att jobbet inte hamnat bland required checks, ett självtest som visar att lagret fäller, och ett tidtal ur CI. Inget av det kräver omdöme om vad som SER rätt ut.

Riskklassen som skulle motivera human-etikett saknas helt: skivan tar inte bort någon kontroll, ändrar ingen GitHub-inställning, rör inte rulesetet och kan per konstruktion inte blockera en landning — en icke-required workflow som failar stoppar ingenting.

Det enda som kräver noggrannhet är skarven mot dedup och mot den delade ci-suite.yml, och båda är lästa filer med radhänvisningar i beskrivningen.
<!-- SECTION:PLAN:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
