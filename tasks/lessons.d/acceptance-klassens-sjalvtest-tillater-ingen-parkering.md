# Acceptance-klassens hermetik-självtest tillåter ingen parkering — döda tester raderas, aldrig skippas

**`describe.skip`/`test.skip` är strukturellt otillåtet i acceptance-klassen:
hermetik-självtestet (`scripts/hermetik-sjalvtest.mjs`) kräver att VARJE test
fälls med `OmockadRequestError` när fixturvärlden töms, och ett hoppat test
rapporterar `skipped` där beviset kräver `unexpected`. Skip-ventil saknas MED
AVSIKT — ett test som överlever utan fixturens svar bevisar inget om appens
databeteende, och exakt det är drift-definitionen.**

Mätt 2026-08-15 (PR `#1306`, TASK-214.4): flippen gjorde den ersatta ytans
åtta acceptanstester subjektlösa; agenten parkerade dem med `describe.skip` —
hela lokala acceptanssviten grön, CI:s självtest fällde med "8 avvikelser".
Fixen: verifiera att VARJE test i filen har den ersatta ytan som subjekt,
radera filen (`git rm`), självtest 229/229 med noll avvikelser + negativ
kontroll grön.

**Det generella (spoke-regel med universell kärna):** i en svit vars
MENINGSFULLHET bevisas mekaniskt är "parkera tills vidare" inte ett neutralt
mellanläge — det är mätbar drift. En död konsument uppdateras genom
borttagning; vill man bevara innehållet för framtiden är git-historiken
platsen, inte en skip-flagga.
