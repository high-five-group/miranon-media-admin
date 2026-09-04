# En grön larmkedja bevisar inte att någon nådde larmet, larmkedjan måste själv verifieras

**[UNIVERSAL] Ett CI-jobb vars uppgift är att larma vid rött kan rapportera
"success" varje gång trots att det underliggande felet består i dagar,
eftersom jobbets egen körning och det faktiska mottagandet av larmet är två
skilda saker. Ett grönt larm-jobb bevisar bara att larm-STEGET kördes, inte
att en människa eller orkestrerare agerade på det.** Mätt 2026-09-02 (S113
paus 9 CARRY, `tasks/sessions/2026-08-29-session-113.md` rad 1965 till 1966,
`TASK-365`): ett e2e-test var rött från födseln (PR #2175) och förblev
odiagnostiserat i minst 47 timmar över minst sex röda körningar, medan
jobbet "Larm vid rött post-merge" avslutades med `success` varje gång.
Rotorsaken var inte testet eller körningen utan att larmkedjan saknade en
faktisk mottagare. Regel: när ett CI-system har ett dedikerat larm-jobb,
verifiera periodiskt att larmet faktiskt NÅR någon (en person, en kanal, en
svep-mekanism som agerar), inte bara att larm-jobbet själv är grönt.
