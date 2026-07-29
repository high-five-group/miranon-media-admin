---
id: TASK-72
title: >-
  Fynd: CI-vakten kan följa fel workflow och rapportera grönt utan att ha sett
  CI-körningen
status: Done
assignee: []
created_date: '2026-07-28 19:31'
updated_date: '2026-07-29 08:56'
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

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
STÄNGT 2026-07-29 (femtonde resumen). Arbetet var LEVERERAT OCH LANDAT sedan 2026-07-28 via PR #383 (`a264a16`, merge `049d8d9`) — kortet var bara aldrig flippat. Detta är alltså inte en leverans utan en bokförings-rättning.

FYNDET: kortet stod `To Do` med samtliga sex AC redan bockade och DoD obockad, medan disken bar hela lösningen. Exakt samma klass som `TASK-63` bar tidigare i denna session, där tre dokument påstod motsatsen till registret. Upptäckt när kortet lästes inför en spawn — hade det spawnats hade en agent byggt om något som redan fanns.

VAD SOM FAKTISKT LIGGER PÅ DISK, verifierat post för post 2026-07-29:

AC #1 — defekten reproducerad och run-ID:na bevarade i `.ci-wait-policy.conf`:s kommentar: på commit `03d18888` valde den okvalificerade formen Post-merge (`30398517485`) i stället för CI (`30398517346`).

AC #2 — formvalet blev alternativ (a), config-driven policy-fil, och motiveringen står i filen själv: logiken är universell och duplicerbar till andra spokes, värdet är projekt-specifikt. Samma hub-spoke-portabilitet som `.checklist-policy.conf`, `.frontmatter-policy.conf` och `.lesson-policy.conf` (Lesson #6, UNIVERSAL). Ett hårdkodat "CI" hade brutit den konventionen.

AC #3 — alla tre lägen täckta: `T13a` (--commit), `T13b` (--pr via headRefOid), `T13c` (--branch). Dessutom `T13d` (flaggan slår policy-värdet) och `T13e` (--run fungerar utan policy).

AC #4 — det tvåsidiga beviset är `T14`: "CI röd + annan workflow grön → 1 (RÖTT, inte falskt grönt)". Körd om 2026-07-29: grön.

AC #5 — `scripts/test-ci-wait.sh` kör 27 fall, samtliga passerade vid omkörning 2026-07-29.

AC #6 — `CONTRIBUTING.md` rad 112 skriver ut både den nya semantiken (exit 3 täcker saknat workflow-namn) OCH att formen fram till 2026-07-28 inte var säker. Den bokför alltså sin egen tidigare osäkerhet i stället för att tyst skrivas om.

DoD #3 verifierad om 2026-07-29: PR #383 bär tolv checkar, samtliga `pass`, inklusive `CI Passed or Skipped`, `Test suite / Acceptance (hermetisk)` 7m2s och `Test suite / Staging (API + E2E)` 6m9s.

DoD #4: PR #383 rörde sex filer, samtliga inom kortets yta (policy-filen, `ci.yml`, `CONTRIBUTING.md`, vakten, dess testsvit, kortet).

VAD FYNDET SÄGER OM VÅRA KONTROLLER: restlistans mekaniska kontroll — lagad tidigare denna resume — jämför KARTAN mot REGISTRET. Här var kartan och registret ENIGA (båda sade öppen) och båda hade fel mot DISKEN. Ingen mekanism jämför registret mot disk, och den axeln är därmed obevakad. `TASK-63` och detta kort är två observationer av samma lucka.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
