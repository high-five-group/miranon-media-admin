# Agent-definitionsfilen laddades mitt i sessionen när en parallell session flyttade huvudkatalogen till `main` — samma bonusklass som en hook

**En ny agent-typ (definierad i `.claude/agents/<namn>.md`) kan bli
tillgänglig MITT I en pågående session, precis som en hook kan (se
CLAUDE.md § En ny hooks skarpbevis kan inte FÖRLITAS på i sessionen som
byggde den) — via harnessets filbevakare, utan att sessionen startats
om. Detta är en BONUS när det händer, aldrig en plan att förlita sig
på: en äldre laddad definition kan fungera bakåtkompatibelt utan att
den nyaste policyn/kommandot finns med.**

**[UNIVERSAL]**

Instans (S112 Del 4, resume 1, 2026-08-26): vid sessionens (resumens)
start saknades agent-typen `review-agent` — huvudkatalogen stod på
`f5ed41d2`, från FÖRE `#1927` (som introducerade agent-definitionen).
Efter att en parallell S108-session bytte huvudkatalogen till `main`
laddade filbevakaren `.claude/agents/review-agent.md` mitt i S112:s
session. Skarpbeviset betalades i förtid: `subagent_type:
"review-agent"` kördes mot `#1932` (Sonnet 5, 42 verktygsanrop) och gav
ett schema-giltigt utlåtande — risk `lag`, 0 error/warning, 2 info-fynd
(bl.a. radnummer-driften i `nightly.yml`, se
`radnummer-citat-i-bevis-driftar.md`). Sessionsdoket namnger explicit
"samma bonus-klass som `task-167`" — mitt-i-sessionen-laddning tas
emot, planeras aldrig.

**Det generella:** både hookar och agent-definitioner bestäms som
utgångspunkt VID SESSIONSSTART (samma strukturella klass som
MCP-verktygsytan, se CLAUDE.md), och en ändring som landar mitt i
sessionen kan INTE förlitas på att slå igenom retroaktivt — men kan
göra det, som bonus, via harnessets filbevakare. Planera alltid för att
förändringen INTE laddas (bokför skulden öppet, betala den nästa
session), och ta emot en tidig laddning som ett giltigt skarpbevis OM
och när den faktiskt inträffar — aldrig som en förutsättning.
