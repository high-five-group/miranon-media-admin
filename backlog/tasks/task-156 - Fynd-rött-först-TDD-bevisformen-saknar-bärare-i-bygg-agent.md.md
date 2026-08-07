---
id: TASK-156
title: 'Fynd: rött-först/TDD-bevisformen saknar bärare i bygg-agent.md'
status: To Do
assignee: []
created_date: '2026-08-07 11:12'
labels: []
dependencies: []
ordinal: 267000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Inventerat i TASK-149.6 (docs/research/arbetsform-reglernas-bararkarta-2026-08-07.md, Fynd 3). CONTRIBUTING.md § "Rött-först — bevisformen" (rad 679-686) slår fast: "Rött-först är obligatoriskt för produktkod: testet skrivs och körs RÖTT lokalt FÖRE den gröna koden." Regeln är ovillkorlig för allt produktkod, inte scopad till en specifik exekveringsväg. Regeln har idag två bärare: CONTRIBUTING.md självt (ingen läs-ordning/agentfil pekar dit som obligatorisk läsning) och hub-skillen do-work/SKILL.md steg 4 ("bygg test-först i vertikala snitt: ett beteende → rött test → minsta gröna kod → nästa"). .claude/agents/bygg-agent.md — enligt sin egen beskrivning agenten för ALLT arbete som skriver till repot och landar i en commit (skivor, fynd-kort, refaktoreringar, CI-ändringar) — nämner INGENTING om rött-först, TDD eller test-innan-kod. Verifierat skarpt: grep -ni "rött|TDD|test-först" CLAUDE.md .claude/agents/bygg-agent.md gav enda träffen i CLAUDE.md som ordet RÖTT i en CI-status-kontext (checkarnas färg), obesläktat med TDD-regeln; bygg-agent.md gav noll träffar (verifierat två gånger under passet, inkl. efter att filen fick nytt innehåll landat 2026-08-07 via TASK-148.2/148.3). Sekvensen förstärker fyndet: TASK-36.6 (Done, 2026-07-23/24) etablerade rött-först-bevisformens NUVARANDE hemvist i CONTRIBUTING.md med AC #6 uttryckligen: "Bidragsguiden speglar den nya bärarformen så att regeln är läsbar där arbetet faktiskt görs." bygg-agent.md skapades FYRA DAGAR SENARE (2026-07-28, commit b8ef2f55) som en ny, separat exekveringsväg för backlog-kort — och ärvde aldrig regeln; dess egen "Läs innan du designar"-lista (rad 30-38) listar inte ens CONTRIBUTING.md som obligatorisk läsning. Detta korts (task-149.6) egen DoD har heller ingen TDD-punkt — de fyra generiska DoD-posterna säger inget om rött-först. Regeln saknar alltså bärare på alla fyra axlar (mekanisk/kort-buren/alltid-laddad/agent-fil-buren) för en bygg-agent-exekverad produktkod-skiva; startdörrs-bunden bara till en skill (do-work) som bygg-agent-vägen aldrig anropar.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rött-först/TDD-bevisformen är läsbar direkt i .claude/agents/bygg-agent.md (den dominerande exekveringsvägen för produktkod-skivor) utan omväg via CONTRIBUTING.md eller do-work-skillen — mekanismvalet redovisat med skäl
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
