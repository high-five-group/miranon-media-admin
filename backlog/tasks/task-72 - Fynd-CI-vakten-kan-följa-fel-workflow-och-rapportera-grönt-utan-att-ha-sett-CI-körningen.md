---
id: TASK-72
title: >-
  Fynd: CI-vakten kan följa fel workflow och rapportera grönt utan att ha sett
  CI-körningen
status: To Do
assignee: []
created_date: '2026-07-28 19:31'
updated_date: '2026-07-28 21:13'
labels:
  - ready-for-agent
dependencies: []
ordinal: 152000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
scripts/ci-wait.sh är repots CI-vakt och den enda mekanism som besvarar frågan "är CI grön per jobb?" — DoD-raden i CONTRIBUTING.md kräver den, och orkestreraren förlitar sig på den vid varje landning. Vakten kan följa fel workflow och rapportera GRÖN utan att någonsin ha observerat CI-körningen.

### MEKANISMEN, LÄST I KÄLLAN

list_run() (rad 131-145) anropar `gh run list <selektor> --limit 1` och lägger till `--workflow` ENDAST när WORKFLOW-variabeln är satt. Utan flaggan returnerar gh senaste körningen för commiten oavsett workflow.

resolve_run() (rad 147-170) gör detta för tre av fyra lägen:
  --pr N      -> gh pr view --json headRefOid  ->  list_run --commit <sha>   (ingen workflow)
  --commit    -> list_run --commit <sha>                                      (ingen workflow)
  --branch    -> list_run --branch <namn>                                     (ingen workflow)

Repot kör minst två workflows per push: CI (som bär required-checken "CI Passed or Skipped") och CodeQL. Vilken som är "senast" avgörs av schemaläggning, inte av betydelse.

### EMPIRI

Observerat 2026-07-28 av TASK-70.5:s bygg-agent på commit 148f676: vakten följde CodeQL-körningen 30391886253 och rapporterade "GRÖN per jobb". CI-körningen 30391891964 — den som bär required-checken — observerades aldrig. Båda var gröna, så ingen skada uppstod, men vakten hade rapporterat grönt även om CI varit röd.

Kontrollprov i samma rapport: med `--workflow CI` följde vakten rätt körning.

### VARFÖR DET ÄR ALLVARLIGARE ÄN DET SER UT

Detta är samma klass som L322 (skippbar required check är fail-open) och T105 (rapport skriven ur gammal mätning presenterad som färsk): en mekanism som ser ut att verifiera, men vars gröna besked kan sakna täckning. Vakten är dessutom den sista kontrollen före armering — faller den, faller hela kedjans sista led.

Orkestreraren använde --pr-formen genomgående under S91:s tolfte resume (PR #362-#373). Utfallen höll — jobbnamnen i varje logg var CI:s, och varje PR verifierades separat som MERGED, vilket kräver passerad required check — men det var tur i formen, inte en garanti från vakten.

### FORMFRÅGA SOM KORTET SKA AVGÖRA

Ett default-workflownamn ("CI") hårdkodat i skriptet är projektspecifikt och strider mot repots config-driven-konvention (custom grindvakts-logik är universell, värden bor i per-projekt-config). Alternativ som bör vägas: (a) default via en policy-fil i repot; (b) härled workflow ur required checks via gh api rulesets; (c) kräv --workflow explicit och fäll utan den; (d) följ ALLA workflows för commiten och kräv att var och en är grön. Alternativ (d) är strängast och närmast "grön per jobb"-löftet, men ändrar semantiken.

Relaterat, EJ samma sak: restlistans A3 bär redan en post om att rätta en felaktig rad i ci-wait.sh:s FILHUVUD (påståendet om terminal-kontroll före första sömnen). Det är dokumentation; detta är funktionell defekt.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Defekten reproducerad före fix: en commit med både CI och CodeQL där vakten utan --workflow väljer fel körning — båda run-ID redovisade
- [x] #2 Formvalet fattat och motiverat i PR-texten mot repots config-driven-konvention (hårdkodat namn, policy-fil, härledning ur ruleset, eller alla-workflows)
- [x] #3 Vakten följer rätt körning i lägena --pr, --commit och --branch — ett run-ID per läge redovisat
- [x] #4 Tvåsidigt bevis: vakten rapporterar RÖTT när CI är röd men en annan workflow på samma commit är grön
- [x] #5 scripts/test-ci-wait.sh eller motsvarande täcker valet av körning, så defekten inte kan återuppstå tyst
- [x] #6 CONTRIBUTING.md:s DoD-rad uppdaterad om den anger en anropsform som inte längre är säker
<!-- AC:END -->



## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
