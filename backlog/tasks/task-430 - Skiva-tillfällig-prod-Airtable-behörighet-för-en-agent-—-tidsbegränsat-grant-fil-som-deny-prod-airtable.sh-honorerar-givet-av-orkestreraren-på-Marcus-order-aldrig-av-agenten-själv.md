---
id: TASK-430
title: >-
  Skiva: tillfällig prod-Airtable-behörighet för en agent — tidsbegränsat
  grant-fil som deny-prod-airtable.sh honorerar, givet av orkestreraren på
  Marcus order, aldrig av agenten själv
status: To Do
assignee: []
created_date: '2026-09-07 16:39'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 758000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: Marcus 2026-09-07 (S123 resume 1), verbatim: 'Du och jag får skriva i prod, inte agenter, såvida vi inte givit dem behörighet tillfälligt.' Beslutet 419 A (PR #2442) täcker första halvan: huvudsessionen släpps mot prod via claude.ai-connectorn, agenter (agent_id satt) nekas alltid, PAT-servern nekas överallt. Andra halvan — tillfällig behörighet för en agent — saknar mekanism: MCP-anrop bär ingen kommandosträng, så deny-prod-ref.sh:s bypass-prefix (PROD_REF_GODKAND_AV_MARCUS=<ref>) kan inte återanvändas rakt av. Åtgärd (config-driven, CLAUDE.md § Custom CI-grindvakts-logik): (1) ett skript scripts/prod-airtable-behorighet.sh med formerna 'ge <agent_id> --minuter N --skal "…"' och 'aterkalla <agent_id>' och 'las', som skriver/raderar en grant-fil utanför git (t.ex. <git-common-dir>/prod-airtable-grant.json) med agent_id, utgår (epoch), givet_av, skäl; (2) deny-prod-airtable.sh läser filen fail-closed (saknas/oparsbar/utgången → neka som förr) och släpper ENBART exakt matchande agent_id före utgången, med en loggrad till stderr i samma form som deny-prod-ref.sh:s BYPASS ANVÄND; (3) skriptet får bara köras av huvudsessionen — en agent som försöker 'ge' sig själv nekas (agent_id i hook-JSON saknas för huvudsessionen; skriptet kan pröva CLAUDE_AGENT_ID eller motsvarande — verifiera mot code.claude.com/docs/en/hooks och sub-agents innan design, anta inget fältnamn); (4) tvåsidig testsvit (giltigt grant släpper · utgånget nekar · fel agent_id nekar · korrupt fil nekar · skrivande verktyg utan grant nekar) CI-wirad i gatekeeper-steget; (5) uppdragstexten till en agent som fått grant ska nämna det explicit (ADR-086-källmärkning). Bygg först när PR #2442 landat — samma skript och conf-fil.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 scripts/prod-airtable-behorighet.sh (ge/aterkalla/las) och grant-filen utanför git; deny-prod-airtable.sh honorerar den fail-closed (saknas/utgången/korrupt/fel agent_id → neka) med loggrad vid använd behörighet
- [ ] #2 En agent kan inte ge sig själv behörighet — prövat tvåsidigt mot hook-JSON:ens agent_id-fält och skriptets egen kontrollväg, fältnamnen verifierade mot förstapartsdokumentationen
- [ ] #3 Testsvit ≥ 6 fall (giltigt/utgånget/fel agent/korrupt/utan grant/huvudsession) CI-wirad; skarpbeviset genom harnesset bokfört som öppen skuld enligt CLAUDE.md § En ny hooks skarpbevis
- [ ] #4 Repots CLAUDE.md § Verktygsfakta beskriver mekanismen i EN mening med pekare till skriptet — prosa som inte påstår mer än hooken gör (ADR-083)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
