# En grind som inte ligger i det svep man kör är osynlig — gröna lokala exitkoder täcker bara det svepet faktiskt kör

**CI-jobb bär grindar som INTE ingår i de lokala DoD-kommandona. En utförare
vars hela lokala svep är grönt kan ändå fällas av CI — inte för att något
mättes fel, utan för att grinden aldrig kördes. Inventera målets JOBB-STEG,
inte bara husets kommandolista, innan push.** `[UNIVERSAL]`

Tre mätta instanser i S103: (1) `check-langa-streck` bor i CI-jobbet
"Lint + Audit + TypeCheck", inte i `check:docs` — fälldes först i Del 11,
igen på PR `#1301` (TASK-214.2, 2026-08-14: agentens typecheck/Biome/build/
test:api alla exit 0, CI rött ändå). (2) Samma jobb bär `check-mailto` —
samma osynlighet. (3) Hermetik-självtestet bor i Acceptance-JOBBET, inte i
`test:acceptance` — fällde PR `#1306` (TASK-214.4) på `describe.skip` som
hela den lokala acceptanssviten accepterade grönt.

**Fångsten och fixen i drift:** efter `#1301` läste 214.2-agenten själv HELA
stegkedjan i det fällande jobbet och identifierade exakt vilka `run:`-steg
som saknades i det lokala svepet — därefter bar varje efterföljande
agent-uppdrag de grindarna som explicit NAKET-körda kommandon, och inget
ytterligare varv förlorades.

**Det generella:** "alla mina grindar är gröna" är ett påstående om SVEPETS
täckning, inte om ändringens kvalitet. Vid första CI-fällning: läs jobbets
faktiska steglista och diffa mot det lokala svepet — luckan, inte felet, är
rotorsaken.
