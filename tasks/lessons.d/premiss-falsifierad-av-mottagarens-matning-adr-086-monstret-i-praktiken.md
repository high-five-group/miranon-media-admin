# En uppdragspremiss falsifierad av mottagarens mätning, ADR-086-mönstret fungerade skarpt

Ett uppdrag om att bygga en kvitto-förhandsgranskning bar premissen "ren
frontend", att inget nytt backend-arbete skulle krävas. Mätt 2026-09-01
(S113 Del 15, `tasks/sessions/2026-08-29-session-113.md` rad 1592 till
1598): bygg-agenten falsifierade premissen genom att mäta, kvittot
existerade inte som ett färdigt dokument före utskick, den befintliga
`preview-receipt`-funktionen renderade bara typexempel. I stället för att
bygga vidare på den felaktiga premissen eller tyst avvika, följdes
sekvensen ADR-086 föreskriver: STOPP, kartläggning av options-rymden, och
en väg vald utifrån uppdragets uttalade AVSIKT ("exakt samma metod som
bilagorna") snarare än dess bokstav. Resultatet blev en bakåtkompatibel
utökning av `preview-receipt` med en sidoeffektsfri väg, mekaniskt vaktad
av en ny testsvit. Regel: detta är ett konkret, positivt exempel på
ADR-086-mönstret i praktiken, värt att peka nya agenter mot när en premiss
visar sig felaktig mitt i arbetet, STOPPA, kartlägg alternativen, välj
utifrån avsikten, bygg inte vidare på det falska antagandet.
