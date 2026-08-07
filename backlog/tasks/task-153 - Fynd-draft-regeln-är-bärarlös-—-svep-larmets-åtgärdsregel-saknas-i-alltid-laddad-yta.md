---
id: TASK-153
title: >-
  Fynd: draft-regeln är bärarlös — svep-larmets åtgärdsregel saknas i
  alltid-laddad yta
status: Done
assignee: []
created_date: '2026-08-07 11:06'
updated_date: '2026-08-07 11:58'
labels:
  - ready-for-agent
dependencies: []
ordinal: 265000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Symptom: regeln 'parkerad PR sätts till draft' bor enbart i ett lessons-fragment — ingen utförare möter den mekaniskt, och 2026-08-07 stod #862 CLEAN+oarmerad utan att någon orkestrerare kunde avgöra parkerad-vs-glömd ur API-svaret; varje sessions svep larmar var 90:e sekund utan kodifierad åtgärdsregel. Rotorsak del 1 (iterations-ytan) elimineras av T126-mekanismen (task-149.3/149.4 — ingen PR existerar under iteration); denna skiva stänger del 2 (gransknings-ytan): svepet ÄR bäraren, åtgärdsregeln får sin hemvist i alltid-laddad yta. Besläktad: task-149.5 (push-ekonomins kodifiering — samma dokumentytor, samordna formuleringarna om båda är i arbete samtidigt).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Premiss-pass: lessons-fragmentet parkerad-pr-utan-draft läst; heartbeat-svepets armeringskandidat-larmtext + isDraft-filtrering läst i scripts/heartbeat-svep.sh; dagens #862-instans (CLEAN oarmerad feature-PR ägd av parallell session) verifierad i PR-historiken
- [x] #2 Åtgärdsregeln kodifierad i CLAUDE.md § Landning (alltid-laddad yta): en PR skapas som draft ELLER armeras i samma andetag — aldrig CLEAN+oarmerad som vilande tillstånd; svep-larm om armeringskandidat är en ORDER till ägaren (armera eller sätt draft i samma svep), och främmande aktiv sessions PR rörs aldrig — ägarens eget svep bär den
- [x] #3 bygg-agent-instruktionen kompletterad: skapas en PR som INTE ska armeras (gransknings-väntan per uppdraget) skapas den med gh pr create --draft från början
- [ ] #4 Korshänvisning: lessons-fragmentets 'kvarstår som prosa'-rad uppdaterad att peka på den nya bäraren; docs-grindarna gröna; PR armerad, per-jobb-grön
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Levererad via PR #877 (merge 8f007d21), CI grön per jobb. Draft-eller-armera-åtgärdsregeln i CLAUDE.md § Landning; --draft-instruktionen i bygg-agenten; lessons-fragmentet pekar på bäraren.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
