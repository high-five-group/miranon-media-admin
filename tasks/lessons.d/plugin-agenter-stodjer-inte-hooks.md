# Plugin-levererade agenter stödjer inte `hooks`, `mcpServers` eller `permissionMode`

**En agentdefinition som distribueras via ett plugin tappar tyst dessa tre
nycklar. Ska en agent bära en spärr måste definitionen bo i `.claude/agents/`.**

**Empiri (S91, 2026-07-27):** verifierat vid arbetet med agent-partitionering.
Fältet accepteras i plugin-formen utan felmeddelande, men laddas inte — vilket
gör att en spärr man tror är på plats i praktiken saknas.

Konsekvensen är riktningsgivande, inte bara en detalj: **distributionsvägen
bestämmer vilka garantier en agent kan bära.** Plugin-vägen är rätt för
kapabilitet (skills, prompt, verktygsurval) och fel för tvingande spärrar.

**Motmedlet:** bestäm hemvist utifrån vad definitionen ska *garantera*, inte
utifrån var det är bekvämast att lägga den. Behöver agenten en hook eller ett
`permissionMode` — `.claude/agents/`, per repo. Övrigt kan gå via plugin.
