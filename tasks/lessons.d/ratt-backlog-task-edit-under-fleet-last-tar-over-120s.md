# Rått `npx backlog task edit` under fleet-drift kan ta över 120 sekunder och auto-bakgrundas — även `edit` betalar gren-skanningen

**Ett direkt (icke-wrappat) `npx backlog task edit`-anrop under samtidig
fleet-belastning (många agenter, många grenar) kan ta längre än 120
sekunder och auto-bakgrundas av harnesset. Processen fortsätter då
skriva till disk EFTER att den anropande agenten redan har committat —
en tyst race mellan bakgrundsprocessens skrivning och agentens egen
commit. `edit` betalar samma gren-skannings-kostnad som andra
`backlog`-anrop (se CLAUDE.md § Kortnummer, `check_active_branches`),
och ska därför köras via `npm run bl`-wrappern (`scripts/backlog-cli.sh`)
för allt utom `create`.**

Instans (S112, orkestrerarens trail, resume 1, 2026-08-26):
"B1-agenten" körde ett rått `npx backlog task edit`-anrop som tog
längre än 120 sekunder, auto-bakgrundades, och skrev till disk efter
agentens egen commit. (Exakt vilket kort och vilken PR detta gällde
står inte i den del av källan jag haft tillgång till; detalj saknas i
källan.)

**Det generella:** detta är en NY instans av en redan dokumenterad
kostnadsklass (CLAUDE.md § Kortnummer — verktyget skyddar, men bara
halva vägen, mätt för `task list`/`task <id>`/`task create`) — men den
utvidgar räckvidden till `task edit` specifikt, och lägger till en NY
failure-mode utöver ren tidskostnad: en bakgrundad process som skriver
EFTER agentens commit kan lämna backlog-registret i ett tillstånd som
avviker från vad agentens egen commit såg vid commit-tillfället. `npm
run bl -- task edit <id> …` undviker båda genom att köra mot en
isolerad `BACKLOG_CWD`-projektrot utan full gren-skanning.
