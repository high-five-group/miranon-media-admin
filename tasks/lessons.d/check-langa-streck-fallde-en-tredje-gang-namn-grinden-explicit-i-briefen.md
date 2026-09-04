# `check-langa-streck.mjs` fällde ännu en agent som körde hela DoD-listan, nämn grinden explicit i uppdraget

Grinden `node scripts/check-langa-streck.mjs` körs i CI:s "Lint + Audit +
TypeCheck"-jobb men finns varken i `package.json`, i
`scripts/check-docs.sh`, eller i bygg-agent-kontraktets uppräknade
DoD-kommandolista, vilket redan orsakat två fällningar 2026-08-21
(dokumenterat i CLAUDE.md). Mätt 2026-09-01 (S113 resume 7,
`tasks/sessions/2026-08-29-session-113.md` rad 2095 till 2097): en agent
som körde hela DoD-listan (typecheck, Biome, build, test:api) och fick alla
gröna föll ÄNDÅ på samma grind vid push, en tredje mätt instans av samma
lucka. Regel: eftersom grinden är strukturellt osynlig för den som bara
följer den generiska DoD-listan, ska ett uppdrag till en agent som rör
`src/` nämna `node scripts/check-langa-streck.mjs` EXPLICIT i briefen, i
stället för att förlita sig på att agenten själv hittar den i CLAUDE.md.
