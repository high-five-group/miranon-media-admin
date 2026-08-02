---
id: TASK-125
title: Mät Sonnet@high mot Sonnet@xhigh för bygg-agenten
status: To Do
assignee: []
created_date: '2026-08-02 11:47'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 197000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ADR-089 § Beslut 4 (docs/decisions/ADR-089-modell-effort-policy-per-processteg.md): bygg-agentens effort blev EXPLICIT xhigh i denna landning, men nivån behölls omätt mot alternativet — all egen evidens (T113 mätpunkt 1-3) är mätt PÅ xhigh, aldrig jämförd mot high. Detta kort öppnar den jämförelsevågen: bygg N skivor med bygg-agenten på effort: high (temporär override via Agent-anropets model/effort-parametrar eller en tillfällig klon av agentdefinitionen — INTE en permanent frontmatter-ändring förrän data finns) och jämför mot en motsvarande våg på xhigh (T113s befintliga mätpunkter, eller en ny xhigh-våg om ingen jämförbar finns).

Mätaxlar: (1) first-pass-grönt per PR-jobb — samma axel-1-definition som T113-riggen (tasks/threads/T113-sonnet-subagent-matuppfoljning.md): andel bygg-agent-PR:er vars FÖRSTA CI-körning är grön i samtliga obligatoriska jobb utan iteration; (2) tokenkostnad per skiva — faktisk mätt kostnad (input/output-tokens eller motsvarande kronvärde), aldrig en lokal-till-CI-projektion utan att skrivas ut som sådan (CLAUDE.md § Verifiera med CI:s exakta kommandon).

TASK-115-klassens transienter (G0-retry-instanserna) utesluts manuellt vid bedömning, precis som T113s eskalationsregel redan kräver.

Rapport landas i docs/research/ (research-pass-formatet: kort svar, delfrågor, dom, vad som inte kunde beläggas, källförteckning). Ett nivåbyte i .claude/agents/bygg-agent.md sker ENDAST på ett explicit Marcus-beslut fattat MOT den landade rapportens data — denna vågs resultat i sig byter ingenting automatiskt.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Jämförelsevåg körd: n skivor på effort: high mot n skivor på effort: xhigh, n motiverat i rapporten som tillräckligt för att bedöma en skillnad (inte godtyckligt, matchat mot T113-riggens egen n-disciplin och dess n≥2-regel för effektpåståenden)
- [ ] #2 TASK-115-klassens transienter identifierade och exkluderade FÖRE jämförelsen, bokfört vilka som exkluderades och varför
- [ ] #3 Rapport landad i docs/research/ (kort svar, mätmetod, resultat per axel — first-pass-grönt + tokenkostnad, vad som inte kunde beläggas, källförteckning) och länkad från ADR-089 samt tasks/threads/T113-sonnet-subagent-matuppfoljning.md
- [ ] #4 Inget nivåbyte i .claude/agents/bygg-agent.md görs av detta kort — ett byte kräver ett SEPARAT, explicit Marcus-beslut fattat mot rapportens data (ADR-089 § Beslut 4)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
