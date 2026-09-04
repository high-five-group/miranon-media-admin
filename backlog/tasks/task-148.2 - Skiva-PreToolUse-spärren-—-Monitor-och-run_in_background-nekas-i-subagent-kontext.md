---
id: TASK-148.2
title: >-
  Skiva: PreToolUse-spärren — Monitor och run_in_background nekas i
  subagent-kontext
status: Done
assignee: []
created_date: '2026-08-07 09:48'
updated_date: '2026-08-09 07:59'
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
- [x] #6 shellcheck-strict grön; PR armerad, per-jobb-grön
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Levererad via PR #860 (merge 5c43978d), kö-CI grön; spärren + conf + testsvit 18/18 live. Skarpbevis-skulden KVARSTÅR ÖPPEN — betalas nästa session (QA 148.7).

[TASK-169, backlog-städet, 2026-08-09] DoD #1-4 bockade mot belägg (natt-grind run 31291660374: status Done, 0 AC/4 DoD obockade — bokföringsfel, inte saknat arbete). #1: AC redan [x]. #2: PR #860 (merge 5c43978d, 2026-08-07T11:06:16Z) — FULL testsvit (Pure+Build, Acceptance, Webblasarbeteende, Lint+Audit+TypeCheck inkl. shellcheck-strict) SUCCESS. #3: PR #860 MERGED, alla jobb gröna. #4: diff scopad till .claude/settings.json, ci.yml, .subagent-vantan-policy.conf, scripts/deny-subagent-vantan.sh, scripts/test-deny-subagent-vantan.sh, kortfilen — matchar frontmatter modified_files. Skarpbevis-skulden (AC #5) betald, verifierad verbatim i tasks/sessions/archive/2026-08/2026-08-07-session-99.md rad 340-344.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
SKARPBEVIS TAGET i S99-resume 1 (2026-08-07 ~12:20Z): haiku-subagent anropade Bash med run_in_background:true → NEKAD; neka-texten verbatim-matchad mot skriptets rad 174 med ${TOOL_NAME} expanderad (kräver exekvering), subagenten gjorde exakt 1 tool_use (kan ej ha läst skriptet). Differential: befintlig hook (deny-grind-genom-pipe) fällde via harnesset 12:11:39Z samma session ⇒ laddning + logik båda bevisade. Notera: skriptet loggar INTE till hook-fallningar.jsonl (designval, olikt pipe-hooken) — loggens orördhet är förväntad. Skulden ur AC 5 är BETALD.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
