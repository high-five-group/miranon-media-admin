# Konsumerad armering i tät kö-trafik är ett återkommande mönster, inte en engångshändelse

**En PR:s auto-merge-armering kan konsumeras av kö-trafik (en
`failed_checks`-utsparkning, se CLAUDE.md § `autoMergeRequest: null`
betyder INTE "ej armerad") upprepade gånger inom samma session när
landningstakten är hög. Svepets disambiguerings-runda (ett andra
`gh pr merge --auto` + läsning av `isInMergeQueue`) är rätt form för
att skilja en korrekt köad PR från en som tappat sin armering — och
larmet är level-triggered: det ska hålla tills armeringen faktiskt är
återställd, inte bara vid övergången.**

**[UNIVERSAL]**

Instans (S112, 2026-08-24, Paushistorik 1 § Lesson-KANDIDATER punkt 4):
mätt **fem** gånger i en och samma session — `#1917`, `#1919`, `#1927`,
`#1935`, `#1940`.

**Viktig självrättelse (öppet bokförd):** Paushistorik 1:s ursprungliga
lista räknade även `#1932` hit, "×2". Det var **fel**. Del 4:s
efterforskning (resume 1, 2026-08-26) visade att `#1932` aldrig var i
kön och aldrig fick sin armering konsumerad — required-checken saknades
helt eftersom PR:en var en stackad gren som auto-retargetades till
`main` utan att `ci.yml` någonsin triggade (se den separata lärdomen
"En stackad PR som auto-retargetas till main kan bli BLOCKED för
evigt"). "Konsumerad armering ×2" var en feldiagnos av ett symptom
(`BLOCKED`, aldrig landad) som råkade se ut som klassen den listades
under. Tidslinjen bar i själva verket EN `AutoMergeEnabledEvent` och
INGA kö-händelser. De fem instanserna ovan (`#1917` m.fl.) är däremot
verifierat äkta exempel på klassen.

**Det generella:** att en PR står still olandad i en tät kö-session har
flera möjliga rotorsaker som ser identiska ut utifrån (PR:en rör sig
inte) — konsumerad armering är EN av dem, men inte den enda, och att
räkna en instans till fel klass utan att verifiera dess faktiska
tillstånd (`isInMergeQueue`, check-run-historik) upprepar precis det
fel disambiguerings-rundan finns för att förhindra.
