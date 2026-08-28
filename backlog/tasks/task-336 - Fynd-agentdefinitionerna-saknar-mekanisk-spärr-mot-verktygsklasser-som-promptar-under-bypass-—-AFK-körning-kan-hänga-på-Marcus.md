---
id: TASK-336
title: >-
  Fynd: agentdefinitionerna saknar mekanisk spärr mot verktygsklasser som
  promptar under bypass — AFK-körning kan hänga på Marcus
status: To Do
assignee: []
created_date: '2026-08-28 03:54'
labels:
  - fynd
  - ready-for-agent
dependencies: []
ordinal: 604000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus fick 2026-08-28 ~04:40 godkänna ett anrop 'från en agent' medan S108 och S112 båda körde bypassPermissions (S108 bekräftade via cross-session-meddelande; S112:s ~/.claude/settings.json defaultMode=bypassPermissions verifierad). Ingen av sessionerna kunde attribuera prompten. Förstapartskälla (code.claude.com/docs/en/permission-modes.md § Actions no mode auto-approves): under bypass promptar exakt fem klasser — explicita ask-regler (repot har 0), connector-verktyg satta till ask, verktyg som kräver interaktion (AskUserQuestion + MCP-verktyg med requiresUserInteraction), rm/rmdir mot kritisk sökväg, cross-session-godkännanden. deny-regler och deny-hookar promptar ALDRIG. sub-agents.md § Available tools: AskUserQuestion tas ALLTID bort från subagenter — en agentfråga är alltså omöjlig; kvar är MCP-connectorer (github/airtable/resend/vercel/google-drive …) och rm. .claude/agents/bygg-agent.md, review-agent.md, research-pass.md saknar alla tools:/disallowedTools:-frontmatter (grep 2026-08-28) — förbudet mot popup finns bara som prosa i hubbens CLAUDE.md (STOPPA-OCH-FRÅGA-raden), vilket är ADR-083-klassen prosa-som-påstår-mekanism. Orkestreraren broadcastade en AFK-regel till nio körande agenter (gh-CLI i stället för MCP, rm bara i egen worktree/scratchpad) som interimsåtgärd — den överlever inte nästa spawn. Källa: sessionsdok S112 Del 8 (kommande) + scratchpad-anteckning 'Prompt-utredningen'.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 disallowedTools i de tre agentdefinitionernas frontmatter blockerar de MCP-verktygsfamiljer som kan prompta (connectorer) — verifiera mot sub-agents.md vilken syntax som stöds (lista/glob) och att bygg-agentens legitima MCP-behov (Airtable-läsning, chrome-devtools/playwright för visuell QA) bevaras eller ersätts med CLI-vägar; bokför avvägningen i notes
- [ ] #2 AFK-regeln (gh-CLI före MCP, rm bara i egen worktree/scratchpad, aldrig vänta på människa) står i bygg-agent.md + review-agent.md som prosa MED pekare till den mekaniska spärren, aldrig som påstådd mekanism (ADR-083)
- [ ] #3 tvåsidigt skarpbevis: en agent spawnad med den nya definitionen saknar de blockerade verktygen (verifierat i agentens egen verktygslista) och kan fortfarande köra gh + git + npm
- [ ] #4 Marcus-listan/sessionsdok bär frågan vilket terminalfönster prompten dök upp i, så nästa instans kan attribueras
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
