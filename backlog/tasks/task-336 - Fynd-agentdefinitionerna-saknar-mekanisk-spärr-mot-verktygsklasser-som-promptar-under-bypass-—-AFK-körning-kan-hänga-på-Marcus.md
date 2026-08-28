---
id: TASK-336
title: >-
  Fynd: agentdefinitionerna saknar mekanisk spärr mot verktygsklasser som
  promptar under bypass — AFK-körning kan hänga på Marcus
status: To Do
assignee: []
created_date: '2026-08-28 03:54'
updated_date: '2026-08-28 05:43'
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
- [x] #1 disallowedTools i de tre agentdefinitionernas frontmatter blockerar de MCP-verktygsfamiljer som kan prompta (connectorer) — verifiera mot sub-agents.md vilken syntax som stöds (lista/glob) och att bygg-agentens legitima MCP-behov (Airtable-läsning, chrome-devtools/playwright för visuell QA) bevaras eller ersätts med CLI-vägar; bokför avvägningen i notes
- [x] #2 AFK-regeln (gh-CLI före MCP, rm bara i egen worktree/scratchpad, aldrig vänta på människa) står i bygg-agent.md + review-agent.md som prosa MED pekare till den mekaniska spärren, aldrig som påstådd mekanism (ADR-083)
- [ ] #3 tvåsidigt skarpbevis: en agent spawnad med den nya definitionen saknar de blockerade verktygen (verifierat i agentens egen verktygslista) och kan fortfarande köra gh + git + npm
- [x] #4 Marcus-listan/sessionsdok bär frågan vilket terminalfönster prompten dök upp i, så nästa instans kan attribueras
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC #1 (avvägning, disallowedTools-form): sub-agents.md § Available tools (WebFetch-verifierat 2026-08-28) bekräftar dokumenterad serverbred mönstersyntax: mcp__<server> eller mcp__<server>__* tar bort/ger HELA servern, mcp__* (endast i disallowedTools) tar bort all MCP. Format för flera poster är EN kommaseparerad sträng, inte YAML-array (docs-exempel: tools: Read, Grep, Glob, Bash). Vald rad i alla tre filer: disallowedTools: mcp__claude_ai_Airtable, mcp__claude_ai_Gmail, mcp__claude_ai_Google_Calendar, mcp__claude_ai_Google_Drive, mcp__google-drive, mcp__plugin_github_github, mcp__resend, mcp__plugin_resend_resend, mcp__vercel, mcp__nanobanana, mcp__plugin_figma_figma. Blockerar 9 serverfamiljer (resend dubbel-namngiven, samma försiktighet som settings.json:s befintliga send-deny). BEVARAT: mcp__airtable__* (PAT-servern, CLAUDE.md § Arbetsflöde, ingen connector-ask-risk eftersom den inte är en hostad claude.ai-connector), mcp__chrome-devtools__*/mcp__playwright__* (visuell QA/11-golvet), mcp__context7__* (dokumentation). Samma lista i bygg-agent/review-agent/research-pass — ingen av de tre har ett dokumenterat behov av de blockerade familjerna (grep 2026-08-28 mot alla tre filers befintliga text gav noll träffar). AC #2: Ny sektion 'AFK-regel — gh-CLI framför MCP, rm scopad, vänta aldrig (TASK-336)' i BÅDE bygg-agent.md och review-agent.md, uttryckligen märkt PROSA INTE MEKANIK med pekare till disallowedTools-frontmattern som den faktiska spärren (ADR-083, verifierad mot docs/decisions/ADR-083-prosa-som-pastar-mekanism.md före skrivning). research-pass.md fick ingen prosa-sektion — AC #2 namnger bara de två andra filerna, och research-pass har redan en egen Ingen-asynkron-signal-sektion samt gör varken rm eller MCP-anrop i sitt kontrakt. AC #3 — OPPEN SKULD, ej avbockad. Provat 2026-08-28: claude agents/plugin/mcp --help exponerar ingen statisk visa-agentdefinitions-upplosta-verktygspool-vag (claude agents hanterar LIVE bakgrundssessioner, inte definitionsfiler). ToolSearch mot list/agents/tool/inventory/resolved/tools gav ingen ListAgents-traff i denna sessions verktygsyta. Uppdraget angav uttryckligen Du kan INTE spawna agenter sjalv — respekterad som orkestrerar-direktiv, inte omprovad: CLAUDE.md paragraferna om hook- och agentdefinitions-skarpbevis (review-agent.md-precedentet, S112 2026-08-24/26) visar att en definition redigerad MITT I en session inte kan forlitas pa att sla igenom i just den sessionen — ett spawn-forsok nu hade sannolikt bara bevisat den kanda begransningen. Betalas av orkestreraren EFTER landning: spawna en frisk bygg-agent och en review-agent, lat var och en rapportera sin faktiska verktygslista, verifiera att de 11 blockerade familjerna saknas och att gh/git/npm fungerar oforandrat. AC #4: Marcus-listan punkt 17 (tasks/marcus-listan.md rad 385) bar redan fragan stalld till Marcus, obesvarad i vantan pa hans svar, kallhanvisar TASK-336. Ingen filandring behovdes, avbockad med pekare per uppdragets instruktion. Premiss-pass (ADR-086): git fetch + merge-base bekraftade origin/main pa 9a2b4732 (matchar uppdragets 9a2b4732+, ingen divergens). grep bekraftade noll tools-/disallowedTools-rader i alla tre filer FORE andringen. sub-agents.md och permission-modes.md WebFetch-verifierade ord for ord mot uppdragets citat — inga avvikelser. gh pr view 2046 visade att den PR:en ar den MERGADE dokumentations-PR:en som MINTADE detta kort, inte en konkurrerande losnings-PR — ingen kollision.

Rättelse (review runda 2, info-fynd): AC #1-notens 'Blockerar 9 serverfamiljer' är räknefel — listan bär TIO distinkta familjer (resend + plugin_resend_resend räknas som EN dubbel-namngiven familj), 11 tool-poster totalt i disallowedTools-frontmatterns fält. Frontmatter-fältet självt är opåverkat och korrekt; bara prosans siffra var fel.
<!-- SECTION:NOTES:END -->
