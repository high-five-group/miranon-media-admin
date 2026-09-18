---
id: TASK-462
title: >-
  Heartbeat-svepet ska vara sessionsmedvetet — larma bara på den egna sessionens
  PR:er
status: To Do
assignee: []
created_date: '2026-09-18 11:53'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 802000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt 2026-09-18 (S126 parallellt med S127): scripts/heartbeat-svep.sh sveper ALLA öppna PR:er i repot och rapporterar RÖTT, DIRTY och ARMERINGS-KANDIDAT level-triggered var 90:e sekund. Med två aktiva sessioner får var och en den andras larm: S126 väcktes åtta gånger av S127:s och Dependabots PR:er (#2506, #2536, #2538) och löste det med ett handhållet grep-filter per PR-nummer i monitor-kommandot. HEARTBEAT_EXEMPT_AUTHORS hjälper inte — alla agent-PR:er går under samma konto, och undantaget gäller bara armerings-vägen, inte RÖTT-vägen. Två risker: (1) varje falsk väckning kostar en modell-tur och kontext; (2) ett ARMERINGS-KANDIDAT-larm är enligt CLAUDE.md en ORDER ('armera eller draft i samma svep') — riktad till PR:ens ägare, men svepet säger inte vem ägaren är, så fel session kan armera eller parkera en främmande sessions halvfärdiga PR (en D0-PR landar då utan granskning). Regeln 'en främmande aktiv sessions PR rörs aldrig' är i dag ren prosa. Det handhållna filtret bär dessutom motsatt risk: ett felskrivet nummer döljer den EGNA PR:ens röda. Efter kortet vet svepet vilka PR:er som tillhör sessionen och rapporterar bara dem (med en flagga för att se allt). Form att pröva — orkestrerarens rekommendation, inte ett beslut: en PR-ETIKETT per session (session:S126), satt av bygg-agenten vid gh pr create och av orkestreraren på egna PR:er; svepet filtrerar på etiketten. Skäl: etiketten är synlig på GitHub, överlever paus/resume och kompaktering (till skillnad från en otrackad tillståndsfil), kräver ingen grennamns-konvention, och följer hur stora projekt äger arbete (Kubernetes area/sig-etiketter). Alternativ att väga: grennamns-prefix per session; otrackad lista i arbetsträdet. Berör: scripts/heartbeat-svep.sh + .heartbeat-svep-policy.conf + testsviten, .label-policy.json, .claude/agents/bygg-agent.md (etikett vid PR-skapande), och hubbens session-start/session-resume (monitor-kommandot bär sessionens etikett) — hub-delen som egen commit i hub-repot. Marcus 2026-09-18: 'Sjukt viktig kort-kandidat … Måste väl åtgärdas snarast'.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Svepet rapporterar RÖTT/DIRTY/ARMERINGS-KANDIDAT enbart för PR:er som bär sessionens markör; en flagga (t.ex. --alla) ger dagens beteende
- [ ] #2 Tvåsidig testsvit: en främmande röd PR ger INGET larm i sessionsläge men larm med --alla; en egen röd PR larmar i båda
- [ ] #3 En PR UTAN markör (glömd etikett) syns i ett eget, lågfrekvent besked — aldrig tyst, aldrig som order
- [ ] #4 Dependabot-PR:er: beslut utskrivet om de tillhör ingen session (egen kanal) eller den session som äger huvudkatalogen
- [ ] #5 bygg-agentens kontrakt och session-start/-resume bär markören; CLAUDE.md § Landning säger vad svepet nu gör — utan att påstå mer än mekanismen håller (ADR-083)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
