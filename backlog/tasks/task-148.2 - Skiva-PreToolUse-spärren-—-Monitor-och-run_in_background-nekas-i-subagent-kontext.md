---
id: TASK-148.2
title: >-
  Skiva: PreToolUse-spärren — Monitor och run_in_background nekas i
  subagent-kontext
status: In Progress
assignee: []
created_date: '2026-08-07 09:48'
updated_date: '2026-08-07 10:47'
labels:
  - ready-for-agent
dependencies:
  - TASK-148.1
references:
  - docs/decisions/ADR-096-subagentens-vantekontrakt.md
  - docs/research/subagent-parkering-handoff-kontrakt-2026-08-05.md § 1.1 + § 5
  - tasks/lessons.md L340
  - L370
modified_files:
  - scripts/deny-subagent-vantan.sh
  - scripts/test-deny-subagent-vantan.sh
  - .subagent-vantan-policy.conf
  - .claude/settings.json
  - .github/workflows/ci.yml
parent_task_id: TASK-148
ordinal: 248000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en subagent som försöker gå in i asynkron väntan (Monitor eller run_in_background) får ett mekaniskt nej med skäl i anropsögonblicket; huvudsessionens egna async-mönster påverkas inte. Fullföljer harnessens eget mönster (fyra async-verktyg redan strukturellt borttagna ur subagenter). Täcker användarberättelser: 1, 2, 3, 8
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Premiss-pass mot LIVE miljö: agent_id-fältet i hook-indata, Monitor i subagentens verktygslista och aktuell harness-version omverifierade mot förstapartsdokumentation/kod; avvikelse mot uppdragets premisser → stanna och flagga
- [x] #2 Minimalt test FÖRE full implementation: skriptet körd manuellt med syntetisk subagent-JSON (agent_id satt) respektive huvudsessions-JSON — deny/allow bevisat åt båda håll
- [x] #3 Skript i scripts/ med universell logik; värdena i egen policy-konfig; registrering i .claude/settings.json på PreToolUse med matchning för Monitor-verktyget och Bash med run_in_background
- [x] #4 Tvåsidig testsvit i test-deny-familjens form: fäller-fall (Monitor+agent_id, run_in_background+agent_id), släpper-fall (samma utan agent_id, orelaterade verktyg), fail-closed-fall (oparsbar indata)
- [x] #5 Skarpbeviset bokfört som ÖPPEN SKULD i kortet och slutrapporten (hook registrerad mitt i session laddas inte) — aldrig rapporterat som taget
- [ ] #6 shellcheck-strict grön; PR armerad, per-jobb-grön
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
SKARPBEVIS ÄR EN ÖPPEN SKULD (CLAUDE.md § "En ny hook kan ALDRIG skarpbevisas i sessionen som byggde den"): hooken registrerades i .claude/settings.json i SAMMA session som byggde den (2026-08-07), och tas därför INTE i bruk förrän nästa session laddar om filbevakningen. Bevisat i BYGGSESSIONEN: (1) logiken tvåsidigt via scripts/test-deny-subagent-vantan.sh (18/18 gröna: D1-D4 fäller, A1-A6 släpper, F1-F7 fail-closed, E1 exit==2) och (2) manuell körning av scriptet mot sju syntetiska hook-JSON direkt på kommandoraden (Monitor+agent_id NEKAS exit 2, Monitor utan agent_id SLÄPPS exit 0, Bash run_in_background:true+agent_id NEKAS, samma utan agent_id SLÄPPS, Bash synkront+agent_id SLÄPPS, oparsbar indata NEKAS, tom stdin NEKAS). INTE bevisat: att en LADDAD hook i en LEVANDE session faktiskt fyrar och blockerar ett riktigt Monitor/Bash-anrop. BETALAS som en av nästa sessions första handlingar med differentialmätning (ADR-087/L370-receptet): provocera denna hook OCH en REDAN laddad hook (t.ex. scripts/deny-grind-genom-pipe.sh) parallellt med identisk hook-JSON — fäller den redan laddade men inte denna, är det registrerings-fördröjningen, inte logiken.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
