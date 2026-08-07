---
id: TASK-160.2
title: 'Skiva: PreCompact-grinden — deny-familjen'
status: Done
assignee: []
created_date: '2026-08-07 16:54'
updated_date: '2026-08-07 18:23'
labels:
  - ready-for-agent
dependencies:
  - TASK-160.1
parent_task_id: TASK-160
ordinal: 284000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: ett kompakterings-försök i en session där läget inte är säkrat i fil stoppas i handlingsögonblicket med anvisningen att köra pre-compact-skillen; ett kontrollerat försök med färsk markör släpps igenom. Täcker användarberättelser: 1, 2
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Premiss-pass mot live: PreCompact-hook-indatans form (trigger-fältet manual/auto) verifierad mot aktuell harness-version FÖRE full implementation
- [x] #2 Hook + policy-conf i deny-familjens form: trigger auto nekar ALLTID med anvisning som pekar på pre-compact-skillen; trigger manual nekar om markörfilen saknas eller är äldre än policyns färskhetsfönster (~15 min); fail-closed på korrupt markör; frånvaro av markör vid manual = neka (grinden är motsatsen till arbetsform-push-grindens frånvaro-släpp — markören är ett AKTIVT bevis)
- [x] #3 Tvåsidig testsvit i deny-familjens form (fäller/släpper/fail-closed mot fixtur); shellcheck-strict grön mot CI-pin; registrerad i settings
- [x] #4 Skarpbevis-skulden ÖPPET bokförd i kortet och slutrapporten med differentialreceptet — ALDRIG rapporterad som tagen (hooken kan inte laddas i byggsessionen)
- [x] #5 PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
SKARPBEVIS-SKULD (öppet bokförd, CLAUDE.md § 'En ny hook kan ALDRIG skarpbevisas i sessionen som byggde den'): scripts/deny-precompact.sh är registrerad i .claude/settings.json men INTE tagen i bruk i byggsessionen — ingen reload-väg finns. Logiken är bevisad TVÅSIDIGT i byggsessionen: (a) tvåsidig testsvit scripts/test-deny-precompact.sh, 20/20 gröna mot en äkta git-fixtur; (b) manuell körning mot DENNA worktrees verkliga tillstånd (riktig git rev-parse --show-toplevel) för tre lägen — auto nekas, manual utan markör nekas, manual med färsk markör släpper — samtliga bekräftade med exit-kod + stderr-text i slutrapporten.

DIFFERENTIALRECEPT för nästa session (betalar skulden): (1) kör /compact <valfri instruktion> UTAN en satt markörfil — hooken ska neka och stderr-meddelandet 'ingen markörfil ... NEKAS' ska synas för Marcus (hooks.md: manuell /compact visar stderr för användaren). (2) Provocera SAMTIDIGT en REDAN laddad syskonhook som kontroll, t.ex. en git push under aktiv arbetsform 'iteration' (ska nekas av deny-arbetsform-push.sh) — om kontrollhooken nekar men PreCompact-hooken INTE gör det är felet i REGISTRERINGEN av just detta event, inte i hooks generellt. (3) Sätt en giltig markör (JSON-formen i .precompact-policy.conf) och bekräfta att /compact DÅ går igenom. (4) Auto-triggerbanan (trigger=auto) kräver den sänkta tröskeln (TASK-160.5, ej byggd av denna skiva) för att fyra naturligt i en levande session — fram tills dess är auto-grenen bevisad genom manuellt konstruerad hook-JSON (denna sessions manuella körning), INTE genom en verklig harness-triggad auto-compact.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängd i S99 resume 2 (2026-08-07): PR #943 mergad 30661d28, per-jobb-grön (12 pass + 3 klassnings-skip). deny-precompact.sh i deny-familjen: auto nekas alltid, manual kräver färsk markör (15 min, strikt gräns), ovillkorligt fail-closed (F1–F8 bevisar neka trots perfekt läge när miljön brister). 20/20 testfall + manuell trippelkörning mot verkligt träd. Policy-confen definierar markör-kontraktet (PRECOMPACT_MARKOR_FILNAMN=.claude/precompact-markor.json) — konvergerade utan synk med hub-skillens läsning (160.3). Skarpbevis-skulden ÖPPEN i kortets notes med fyrstegs-differentialrecept; auto-grenens naturliga fyrning kräver 160.5:s tröskel. Orelaterad dubbelröd i test:api (två staging-live-tester) verifierad grön i omkörning — inte denna skivas yta.
<!-- SECTION:FINAL_SUMMARY:END -->
